import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export const ENV_PATH = path.join(serverRoot, ".env");

export function saveApiKey(apiKey: string): void {
  const trimmed = apiKey.trim();
  const existing = fs.existsSync(ENV_PATH)
    ? fs.readFileSync(ENV_PATH, "utf8")
    : "";
  const lines = existing.length > 0 ? existing.split(/\r?\n/) : [];
  let replaced = false;

  const nextLines = lines.map((line) => {
    if (/^\s*TYPESAFE_API_KEY\s*=/.test(line)) {
      replaced = true;
      return `TYPESAFE_API_KEY=${trimmed}`;
    }

    return line;
  });

  if (!replaced) {
    nextLines.push(`TYPESAFE_API_KEY=${trimmed}`);
  }

  fs.writeFileSync(
    ENV_PATH,
    `${nextLines.join("\n").replace(/\n+$/, "")}\n`,
    { encoding: "utf8", mode: 0o600 },
  );
  process.env.TYPESAFE_API_KEY = trimmed;
}
