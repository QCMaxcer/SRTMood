import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  analyzeTexts,
  AnalysisEntry,
  AnalyzeResponse,
  DEFAULT_CONCURRENCY,
  EmotionDefinitionInput,
  testJevConnection,
} from "./analyzer.js";
import { ENV_PATH, saveApiKey } from "./envStore.js";

dotenv.config({ path: ENV_PATH });

const serverRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const clientDist = path.resolve(serverRoot, "../client/dist");
const port = Number(process.env.PORT ?? 3001);
// 本地工具默认只监听回环地址，避免 Windows 防火墙弹窗和局域网暴露。
const host = process.env.HOST ?? "127.0.0.1";

const app = express();

app.use(cors());
app.use(express.json({ limit: "6mb" }));

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

const asyncRoute =
  (handler: AsyncHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };

async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.typesafe.ai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

function maskApiKey(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (trimmed.length <= 8) {
    return `${trimmed.slice(0, 2)}****${trimmed.slice(-2)}`;
  }

  return `${trimmed.slice(0, 4)}****${trimmed.slice(-4)}`;
}

app.get("/api/settings/status", (_req, res) => {
  const apiKey = process.env.TYPESAFE_API_KEY?.trim() ?? "";
  res.json({
    configured: Boolean(apiKey),
    keyPreview: apiKey ? maskApiKey(apiKey) : "",
  });
});

app.post(
  "/api/settings/key",
  asyncRoute(async (req, res) => {
    const apiKey =
      typeof req.body?.apiKey === "string" ? req.body.apiKey.trim() : "";

    if (!apiKey) {
      res.status(400).json({ error: "API key is required." });
      return;
    }

    const valid = await validateApiKey(apiKey);
    if (!valid) {
      res.status(401).json({ error: "The TypeSafe API key is invalid or unreachable." });
      return;
    }

    saveApiKey(apiKey);
    res.json({ configured: true });
  }),
);

app.post(
  "/api/settings/test",
  asyncRoute(async (req, res) => {
    const apiKey = process.env.TYPESAFE_API_KEY?.trim();
    if (!apiKey) {
      res.status(400).json({ error: "TypeSafe API key is not configured." });
      return;
    }

    try {
      const result = await testJevConnection(apiKey);
      res.json({ ok: true, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(502).json({ ok: false, error: message });
    }
  }),
);

app.post(
  "/api/analyze",
  asyncRoute(async (req, res) => {
    const apiKey = process.env.TYPESAFE_API_KEY?.trim();
    if (!apiKey) {
      res.status(400).json({ error: "TypeSafe API key is not configured." });
      return;
    }

    const entries = req.body?.entries;
    if (
      !Array.isArray(entries) ||
      entries.some(
        (entry: AnalysisEntry) =>
          typeof entry?.text !== "string" ||
          (entry.previous !== undefined && !Array.isArray(entry.previous)) ||
          (entry.next !== undefined && !Array.isArray(entry.next)),
      )
    ) {
      res.status(422).json({ error: "The request must include a subtitle entries array." });
      return;
    }

    const emotions = req.body?.emotions;
    if (
      !Array.isArray(emotions) ||
      emotions.length === 0 ||
      emotions.some(
        (emotion: EmotionDefinitionInput) =>
          typeof emotion?.id !== "string" || typeof emotion?.label !== "string",
      )
    ) {
      res.status(422).json({
        error: "The request must include a non-empty emotions array.",
      });
      return;
    }

    const response: AnalyzeResponse = await analyzeTexts(
      entries,
      apiKey,
      emotions,
      DEFAULT_CONCURRENCY,
    );
    res.json(response);
  }),
);

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use(
  (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  },
);

app.listen(port, host, () => {
  console.log(`SRTMood API listening on http://${host}:${port}`);
});
