export type EmotionMap = Record<string, string>;

export interface EmotionDefinition {
  id: string;
  label: string;
  color: string;
  emojis: string[];
  addEmoji: boolean;
  definition: string;
  includes: string[];
  excludes: string[];
  examples: string[];
}

export interface AnalysisResult {
  index: number;
  emotion: string | null;
  confidence: number;
  shouldAddEmoji: number | null;
  probabilities: Record<string, number>;
  error?: string;
}

export interface SrtCue {
  index: number;
  start: string;
  end: string;
  text: string;
}

export interface TxtLine {
  index: number;
  text: string;
}

export type SubtitleDocument =
  | {
      kind: "srt";
      newline: "\r\n" | "\n";
      trailingNewline: boolean;
      cues: SrtCue[];
    }
  | {
      kind: "txt";
      newline: "\r\n" | "\n";
      lines: TxtLine[];
    };

export interface AnalyzedItem {
  key: string;
  kind: "srt" | "txt";
  sourceIndex: number;
  text: string;
  context: {
    previous: string[];
    next: string[];
  };
}
