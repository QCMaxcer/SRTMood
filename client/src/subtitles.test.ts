import { describe, expect, it } from "vitest";
import { DEFAULT_EMOTIONS } from "./emotions";
import {
  buildEmojiAssignments,
  buildAnalysisItems,
  parseSubtitleDocument,
  serializeDocument,
} from "./subtitles";
import type { AnalysisResult } from "./types";

const defaultSettings = {
  applyEnabled: true,
  addEmojiThreshold: 0.6,
  emotions: DEFAULT_EMOTIONS,
};

describe("SRT parsing", () => {
  it("parses multiline cues and timing", () => {
    const document = parseSubtitleDocument(
      "1\r\n00:00:01,000 --> 00:00:03,000\r\nHello\r\nWorld\r\n\r\n2\r\n00:00:04,000 --> 00:00:06,000\r\n再见\r\n",
      "srt",
    );

    expect(document.kind).toBe("srt");
    if (document.kind !== "srt") return;
    expect(document.newline).toBe("\r\n");
    expect(document.trailingNewline).toBe(true);
    expect(document.cues).toHaveLength(2);
    expect(document.cues[0].text).toBe("Hello\nWorld");
    expect(document.cues[1].start).toBe("00:00:04,000");
  });
});

describe("TXT parsing", () => {
  it("keeps blank lines and preserves a trailing newline", () => {
    const document = parseSubtitleDocument("第一行\n\n第二行\n", "txt");

    expect(document.kind).toBe("txt");
    if (document.kind !== "txt") return;
    expect(document.lines).toHaveLength(4);
    expect(document.lines[1].text).toBe("");
    expect(document.lines[3].text).toBe("");
  });
});

describe("context window", () => {
  it("includes neighboring non-empty lines while classifying the current line", () => {
    const document = parseSubtitleDocument("one\n\ntwo\n\nthree\n", "txt");
    const items = buildAnalysisItems(document, 1);

    expect(items[1].text).toBe("two");
    expect(items[1].context.previous).toEqual(["one"]);
    expect(items[1].context.next).toEqual(["three"]);
  });
});

describe("emoji decisions", () => {
  const joyResult: AnalysisResult = {
    index: 0,
    emotion: "happy_sneaky",
    confidence: 0.9,
    shouldAddEmoji: 0.9,
    probabilities: { happy_sneaky: 0.9, neutral: 0.1 },
  };

  it("applies the mapped emoji for a confident emotional line", () => {
    const document = parseSubtitleDocument("happy\n", "txt");
    const items = buildAnalysisItems(document);
    const assignments = buildEmojiAssignments(
      items,
      [joyResult],
      defaultSettings,
    );

    expect(assignments.get(items[0].key)).toBe("🙂");
  });

  it("does not apply for neutral, ambiguous, or a low add-emoji probability", () => {
    const document = parseSubtitleDocument("happy\n", "txt");
    const items = buildAnalysisItems(document);

    for (const result of [
      { ...joyResult, emotion: "neutral" },
      { ...joyResult, emotion: "ambiguous" },
      { ...joyResult, shouldAddEmoji: 0.5 },
    ]) {
      expect(
        buildEmojiAssignments(items, [result], defaultSettings).size,
      ).toBe(0);
    }
  });

  it("does not apply when the toggle is off or the mapping is empty", () => {
    const document = parseSubtitleDocument("happy\n", "txt");
    const items = buildAnalysisItems(document);

    expect(
      buildEmojiAssignments(
        items,
        [joyResult],
        { ...defaultSettings, applyEnabled: false },
      ).size,
    ).toBe(0);

    expect(
      buildEmojiAssignments(
        items,
        [joyResult],
        {
          ...defaultSettings,
          emotions: DEFAULT_EMOTIONS.map((emotion) =>
            emotion.id === "happy_sneaky"
              ? { ...emotion, emojis: [] }
              : emotion,
          ),
        },
      ).size,
    ).toBe(0);
  });

  it("rotates through multiple emojis when the same emotion is not consecutive", () => {
    const document = parseSubtitleDocument("a\nb\nc\nd\ne\n", "txt");
    const items = buildAnalysisItems(document);
    const results: AnalysisResult[] = items.map((_, index) => ({
      index,
      emotion: index % 2 === 0 ? "happy_sneaky" : "sadness",
      confidence: 0.9,
      shouldAddEmoji: 0.9,
      probabilities: { happy_sneaky: 0.9 },
    }));

    const assignments = buildEmojiAssignments(items, results, {
      ...defaultSettings,
    });

    expect(assignments.get(items[0].key)).toBe("🙂");
    expect(assignments.get(items[1].key)).toBe("😥");
    expect(assignments.get(items[2].key)).toBe("😋");
    expect(assignments.get(items[3].key)).toBe("😥");
    expect(assignments.get(items[4].key)).toBe("🙂");
  });

  it("does not add the same emotion on two consecutive subtitles", () => {
    const document = parseSubtitleDocument("a\nb\nc\n", "txt");
    const items = buildAnalysisItems(document);
    const results: AnalysisResult[] = items.map((_, index) => ({
      index,
      emotion: index === 2 ? "sadness" : "happy_sneaky",
      confidence: 0.9,
      shouldAddEmoji: 0.9,
      probabilities: { happy_sneaky: 0.9 },
    }));

    const assignments = buildEmojiAssignments(items, results, defaultSettings);

    expect(assignments.get(items[0].key)).toBe("🙂");
    expect(assignments.has(items[1].key)).toBe(false);
    expect(assignments.get(items[2].key)).toBe("😥");
  });
});

describe("serialization", () => {
  it("appends emoji to SRT cue text and preserves timing", () => {
    const document = parseSubtitleDocument(
      "1\n00:00:01,000 --> 00:00:02,000\nHello\n",
      "srt",
    );
    const items = buildAnalysisItems(document);
    const results: AnalysisResult[] = [
      {
        index: 0,
        emotion: "happy_sneaky",
        confidence: 0.95,
        shouldAddEmoji: 0.95,
        probabilities: { happy_sneaky: 0.95 },
      },
    ];

    const output = serializeDocument(document, items, results, defaultSettings);
    expect(output).toBe("1\n00:00:01,000 --> 00:00:02,000\nHello 🙂\n");
  });

  it("appends emoji only to non-empty TXT lines", () => {
    const document = parseSubtitleDocument("你好\n\n再见\n", "txt");
    const items = buildAnalysisItems(document);
    const results: AnalysisResult[] = [
      {
        index: 0,
        emotion: "laughable",
        confidence: 0.8,
        shouldAddEmoji: 0.8,
        probabilities: { laughable: 0.8 },
      },
      {
        index: 1,
        emotion: "neutral",
        confidence: 1,
        shouldAddEmoji: 0.1,
        probabilities: { neutral: 1 },
      },
    ];

    const output = serializeDocument(document, items, results, defaultSettings);
    expect(output).toBe("你好 🤣\n\n再见\n");
  });
});
