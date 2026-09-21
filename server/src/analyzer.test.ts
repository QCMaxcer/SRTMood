import { describe, expect, it } from "vitest";
import type { TypeSafeClient } from "@typesafe-ai/sdk";
import { analyzeTexts, MAX_TEXTS } from "./analyzer.js";

const EMOTIONS = [
  { id: "joy", label: "开心" },
  { id: "neutral", label: "平淡" },
  { id: "ambiguous", label: "无法判断" },
];

type MockAnswer = {
  type: "choice";
  choice: string;
  confidence: number;
  shouldAddEmoji?: number;
  probabilities: Record<string, number>;
};

function createMockClient(
  handler: (text: string) => { result?: MockAnswer; error?: Error } | MockAnswer,
): TypeSafeClient {
  return {
    systemOne: async ({ state }: { state: { current: string } }) => {
      const output = handler(state.current);
      if (output instanceof Error) {
        throw output;
      }

      if ("error" in output && output.error) {
        throw output.error;
      }

      const result = "result" in output ? output.result! : output;
      return {
        model: "jev-1.13.0",
        answers: {
          emotion: result,
          should_add_emoji: {
            type: "noul",
            noul: result.shouldAddEmoji ?? 0.9,
          },
        },
        usage: { input_tokens: 1, output_tokens: 1 },
      };
    },
  } as unknown as TypeSafeClient;
}

function entry(text: string) {
  return { text, previous: [], next: [] };
}

describe("analyzeTexts", () => {
  it("maps each text to its emotion result and preserves order", async () => {
    const client = createMockClient((text) => {
      if (text === "first") {
        return {
          type: "choice",
          choice: "joy",
          confidence: 0.9,
          shouldAddEmoji: 0.9,
          probabilities: { joy: 0.9, neutral: 0.1 },
        };
      }

      return {
        type: "choice",
        choice: "neutral",
        confidence: 1,
        probabilities: { neutral: 1 },
      };
    });

    const response = await analyzeTexts(
      [entry("first"), entry("second")],
      "secret",
      EMOTIONS,
      2,
      () => client,
    );

    expect(response.model).toBe("jev-1.13.0");
    expect(response.results).toHaveLength(2);
    expect(response.results[0]).toMatchObject({
      index: 0,
      emotion: "joy",
      confidence: 0.9,
      shouldAddEmoji: 0.9,
    });
    expect(response.results[1]).toMatchObject({
      index: 1,
      emotion: "neutral",
    });
  });

  it("returns an error item when an individual request fails", async () => {
    const client = createMockClient((text) => {
      if (text === "bad") {
        return { error: new Error("rate limited") };
      }

      return {
        type: "choice",
        choice: "ambiguous",
        confidence: 0.2,
        probabilities: { ambiguous: 1 },
      };
    });

    const response = await analyzeTexts(
      [entry("bad"), entry("ok")],
      "secret",
      EMOTIONS,
      2,
      () => client,
    );

    expect(response.results[0]).toMatchObject({
      index: 0,
      emotion: null,
      error: "rate limited",
    });
    expect(response.results[1].emotion).toBe("ambiguous");
  });

  it("rejects batches larger than the configured limit", async () => {
    await expect(
      analyzeTexts(
        new Array(MAX_TEXTS + 1).fill(entry("text")),
        "secret",
        EMOTIONS,
      ),
    ).rejects.toThrow(/At most/);
  });

  it("rejects an empty API key", async () => {
    await expect(analyzeTexts([entry("text")], "   ", EMOTIONS)).rejects.toThrow(
      /not configured/,
    );
  });
});
