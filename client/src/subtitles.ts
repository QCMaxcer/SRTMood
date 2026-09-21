import type {
  AnalysisResult,
  AnalyzedItem,
  EmotionDefinition,
  SrtCue,
  SubtitleDocument,
  TxtLine,
} from "./types";

export interface EmojiSettings {
  applyEnabled: boolean;
  addEmojiThreshold: number;
  emotions: EmotionDefinition[];
}

const TIMING_RE =
  /^\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})/;

function detectNewline(text: string): "\r\n" | "\n" {
  return text.includes("\r\n") ? "\r\n" : "\n";
}

export function parseSrt(raw: string): SrtCue[] {
  const normalized = raw.replace(/\r\n?/g, "\n");
  const blocks = normalized.split(/\n[ \t]*\n/);
  const cues: SrtCue[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) {
      continue;
    }

    const lines = trimmed.split("\n");
    const first = lines.shift();
    if (!first) {
      continue;
    }

    const hasIndex = /^\s*\d+\s*$/.test(first);
    const timingSource = hasIndex ? lines.shift() : first;
    const timingMatch = timingSource?.match(TIMING_RE);

    if (!timingMatch) {
      continue;
    }

    const text = lines.join("\n").trim();
    cues.push({
      index: cues.length + 1,
      start: timingMatch[1],
      end: timingMatch[2],
      text,
    });
  }

  return cues;
}

export function parseTxt(raw: string): TxtLine[] {
  return raw.split(/\r?\n/).map((text, index) => ({ index, text }));
}

export function parseSubtitleDocument(
  raw: string,
  kind: "srt" | "txt",
): SubtitleDocument {
  if (kind === "srt") {
    return {
      kind: "srt",
      newline: detectNewline(raw),
      trailingNewline: /(?:\r\n|\n)$/.test(raw),
      cues: parseSrt(raw),
    };
  }

  return {
    kind: "txt",
    newline: detectNewline(raw),
    lines: parseTxt(raw),
  };
}

export function buildAnalysisItems(
  document: SubtitleDocument,
  contextWindow = 0,
): AnalyzedItem[] {
  const entries: Omit<AnalyzedItem, "context">[] =
    document.kind === "srt"
      ? document.cues
          .map((cue, sourceIndex) => ({
            key: `srt-${sourceIndex}`,
            kind: "srt" as const,
            sourceIndex,
            text: cue.text,
          }))
          .filter((item) => item.text.trim().length > 0)
      : document.lines
          .map((line, sourceIndex) => ({
            key: `txt-${sourceIndex}`,
            kind: "txt" as const,
            sourceIndex,
            text: line.text,
          }))
          .filter((item) => item.text.trim().length > 0);

  return entries.map((entry, index) => {
    const start = Math.max(0, index - contextWindow);
    return {
      ...entry,
      context: {
        previous: entries.slice(start, index).map((item) => item.text),
        next: entries
          .slice(index + 1, index + 1 + contextWindow)
          .map((item) => item.text),
      },
    };
  });
}

export function buildEmojiAssignments(
  items: AnalyzedItem[],
  results: AnalysisResult[],
  settings: EmojiSettings,
): Map<string, string> {
  const assignments = new Map<string, string>();
  if (!settings.applyEnabled) {
    return assignments;
  }

  const counters = new Map<string, number>();
  let previousAddedEmotionId: string | null = null;

  items.forEach((item, index) => {
    const result = results[index];
    let added = false;

    if (
      result &&
      !result.error &&
      result.emotion &&
      result.shouldAddEmoji !== null &&
      result.shouldAddEmoji >= settings.addEmojiThreshold
    ) {
      const emotion = settings.emotions.find(
        (candidate) => candidate.id === result.emotion,
      );
      const repeatedSameEmotion =
        previousAddedEmotionId === result.emotion;

      if (emotion && emotion.addEmoji && !repeatedSameEmotion) {
        const options = emotion.emojis
          .map((emoji) => emoji.trim())
          .filter(Boolean);

        if (options.length > 0) {
          const count = counters.get(result.emotion) ?? 0;
          assignments.set(item.key, options[count % options.length]);
          counters.set(result.emotion, count + 1);
          added = true;
        }
      }
    }

    previousAddedEmotionId = added ? result?.emotion ?? null : null;
  });

  return assignments;
}

function appendEmoji(text: string, emoji: string): string {
  const newline = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(/\r?\n/);
  const lastIndex = Math.max(0, lines.length - 1);
  lines[lastIndex] = `${lines[lastIndex]} ${emoji}`;
  return lines.join(newline);
}

export function serializeDocument(
  document: SubtitleDocument,
  items: AnalyzedItem[],
  results: AnalysisResult[],
  settings: EmojiSettings,
): string {
  const assignments = buildEmojiAssignments(items, results, settings);

  if (document.kind === "srt") {
    const newline = document.newline;
    const blocks = document.cues.map((cue, sourceIndex) => {
      const emoji = assignments.get(`srt-${sourceIndex}`) ?? null;
      const text = emoji ? appendEmoji(cue.text, emoji) : cue.text;
      return `${cue.index}${newline}${cue.start} --> ${cue.end}${newline}${text}`;
    });
    const output = blocks.join(`${newline}${newline}`);
    return document.trailingNewline ? `${output}${newline}` : output;
  }

  const newline = document.newline;
  const lines = document.lines.map((line, sourceIndex) => {
    const emoji = assignments.get(`txt-${sourceIndex}`) ?? null;
    return emoji ? appendEmoji(line.text, emoji) : line.text;
  });
  return lines.join(newline);
}
