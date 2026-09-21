import type { AnalysisResult, EmotionDefinition } from "./types";

export interface AnalyzeApiResponse {
  results: AnalysisResult[];
  model: string | null;
}

export interface AnalysisEntry {
  text: string;
  previous: string[];
  next: string[];
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  const body = (await response.json().catch(() => ({}))) as T & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(body.error || `Request failed with status ${response.status}`);
  }

  return body;
}

export interface SettingsStatus {
  configured: boolean;
  keyPreview: string;
}

export interface JevTestResult {
  ok: boolean;
  model: string;
  latencyMs: number;
}

export function getSettingsStatus(): Promise<SettingsStatus> {
  return request<SettingsStatus>("/api/settings/status");
}

export function saveApiKey(apiKey: string): Promise<{ configured: boolean }> {
  return request<{ configured: boolean }>("/api/settings/key", {
    method: "POST",
    body: JSON.stringify({ apiKey }),
  });
}

export function analyzeTexts(
  entries: AnalysisEntry[],
  emotions: EmotionDefinition[],
): Promise<AnalyzeApiResponse> {
  return request<AnalyzeApiResponse>("/api/analyze", {
    method: "POST",
    body: JSON.stringify({
      entries,
      emotions: emotions.map((emotion) => ({
        id: emotion.id,
        label: emotion.label,
        definition: emotion.definition,
        includes: emotion.includes,
        excludes: emotion.excludes,
        examples: emotion.examples,
      })),
    }),
  });
}

export function testJevConnection(): Promise<JevTestResult> {
  return request<JevTestResult>("/api/settings/test", {
    method: "POST",
  });
}
