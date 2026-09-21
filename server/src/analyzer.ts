import { choice, noul, TypeSafeClient } from "@typesafe-ai/sdk";
import {
  EMOTION_INSTRUCTIONS,
  SHOULD_ADD_EMOJI_CRITERIA,
  SHOULD_ADD_EMOJI_INSTRUCTIONS,
} from "./emotions.js";

export const MODEL = "jev-latest";
export const DEFAULT_CONCURRENCY = 8;
export const MAX_TEXTS = 5000;
export const MAX_EMOTIONS = 255;

export interface EmotionDefinitionInput {
  id: string;
  label: string;
  definition?: string;
  includes?: string[];
  excludes?: string[];
  examples?: string[];
}

export interface EmotionCriterion {
  label: string;
  definition: string;
  include: string[];
  exclude: string[];
  examples: string[];
  [key: string]: string | string[];
}

export interface AnalysisEntry {
  text: string;
  previous?: string[];
  next?: string[];
}

export interface AnalyzeResultItem {
  index: number;
  emotion: string | null;
  confidence: number;
  shouldAddEmoji: number | null;
  probabilities: Record<string, number>;
  error?: string;
}

export interface AnalyzeResponse {
  results: AnalyzeResultItem[];
  model: string | null;
}

type ClientFactory = (apiKey: string) => TypeSafeClient;

type ClassifySuccess = {
  emotion: string;
  confidence: number;
  shouldAddEmoji: number;
  probabilities: Record<string, number>;
  model: string;
};

export const createTypeSafeClient: ClientFactory = (apiKey) =>
  new TypeSafeClient({ apiKey, defaultModel: MODEL });

async function classifyOne(
  client: TypeSafeClient,
  entry: AnalysisEntry,
  criteria: Record<string, EmotionCriterion>,
): Promise<ClassifySuccess> {
  const response = await client.systemOne({
    state: {
      current: entry.text.trim() || entry.text,
      previous: entry.previous ?? [],
      next: entry.next ?? [],
    },
    model: MODEL,
    questions: {
      emotion: choice(EMOTION_INSTRUCTIONS, criteria),
      should_add_emoji: noul(
        SHOULD_ADD_EMOJI_INSTRUCTIONS,
        SHOULD_ADD_EMOJI_CRITERIA,
      ),
    },
  });

  const answer = response.answers.emotion;
  const emojiAnswer = response.answers.should_add_emoji;

  return {
    emotion: answer.choice,
    confidence: answer.confidence,
    shouldAddEmoji: emojiAnswer.noul,
    probabilities: { ...answer.probabilities },
    model: response.model,
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function cleanBoundaryList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildEmotionCriterion(
  emotion: EmotionDefinitionInput,
): EmotionCriterion {
  return {
    label: emotion.label.trim(),
    definition: emotion.definition?.trim() ?? "",
    include: cleanBoundaryList(emotion.includes),
    exclude: cleanBoundaryList(emotion.excludes),
    examples: cleanBoundaryList(emotion.examples),
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(limit, items.length));

  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) {
        break;
      }

      results[index] = await fn(items[index], index);
    }
  });

  await Promise.all(workers);
  return results;
}

export async function analyzeTexts(
  entries: AnalysisEntry[],
  apiKey: string,
  emotions: EmotionDefinitionInput[],
  concurrency: number = DEFAULT_CONCURRENCY,
  clientFactory: ClientFactory = createTypeSafeClient,
): Promise<AnalyzeResponse> {
  if (entries.length > MAX_TEXTS) {
    throw new Error(`At most ${MAX_TEXTS} subtitle lines can be analyzed at once.`);
  }

  if (!apiKey.trim()) {
    throw new Error("TypeSafe API key is not configured.");
  }

  if (!Array.isArray(emotions) || emotions.length === 0) {
    throw new Error("At least one emotion category is required.");
  }

  if (
    !Array.isArray(entries) ||
    entries.some(
      (entry) =>
        !entry ||
        typeof entry.text !== "string" ||
        (entry.previous !== undefined && !Array.isArray(entry.previous)) ||
        (entry.next !== undefined && !Array.isArray(entry.next)),
    )
  ) {
    throw new Error("Each subtitle entry needs a text and optional context arrays.");
  }

  const criteria: Record<string, EmotionCriterion> = {};
  for (const emotion of emotions) {
    const id = emotion.id.trim();
    const label = emotion.label.trim();
    if (!id || !label) {
      throw new Error("Each emotion category needs an id and a label.");
    }
    if (criteria[id]) {
      throw new Error(`Duplicate emotion id: ${id}`);
    }
    criteria[id] = buildEmotionCriterion({ ...emotion, id, label });
  }

  if (Object.keys(criteria).length > MAX_EMOTIONS) {
    throw new Error(`At most ${MAX_EMOTIONS} emotion categories are supported.`);
  }

  const client = clientFactory(apiKey);
  let model: string | null = null;

  const results = await mapWithConcurrency(
    entries,
    concurrency,
    async (entry, index): Promise<AnalyzeResultItem> => {
      try {
        const answer = await classifyOne(client, entry, criteria);
        if (!model) {
          model = answer.model;
        }

        return {
          index,
          emotion: answer.emotion,
          confidence: answer.confidence,
          shouldAddEmoji: answer.shouldAddEmoji,
          probabilities: answer.probabilities,
        };
      } catch (error) {
        return {
          index,
          emotion: null,
          confidence: 0,
          shouldAddEmoji: null,
          probabilities: {},
          error: errorMessage(error),
        };
      }
    },
  );

  return { results, model };
}

export async function testJevConnection(
  apiKey: string,
  clientFactory: ClientFactory = createTypeSafeClient,
): Promise<{ model: string; latencyMs: number }> {
  if (!apiKey.trim()) {
    throw new Error("TypeSafe API key is not configured.");
  }

  const client = clientFactory(apiKey);
  const startedAt = Date.now();
  const response = await client.systemOne({
    state: "Connectivity check.",
    model: MODEL,
    questions: {
      readable: choice("Is this sentence readable?", {
        readable: null,
        unreadable: null,
      }),
    },
  });

  return {
    model: response.model,
    latencyMs: Date.now() - startedAt,
  };
}
