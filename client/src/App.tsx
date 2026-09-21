import { useEffect, useRef, useState } from "react";
import {
  Download,
  FileDown,
  Loader2,
  Play,
  RotateCcw,
  Square,
} from "lucide-react";
import { analyzeTexts, getSettingsStatus } from "./api";
import { SettingsPanel } from "./components/SettingsPanel";
import { UploadZone } from "./components/UploadZone";
import { ResultsTable } from "./components/ResultsTable";
import {
  createEmotionId,
  loadEmotions,
  PRESET_EMOTION_COLORS,
  saveEmotions,
  swapEmotions,
} from "./emotions";
import {
  buildAnalysisItems,
  parseSubtitleDocument,
  serializeDocument,
} from "./subtitles";
import type {
  AnalysisResult,
  AnalyzedItem,
  EmotionDefinition,
  SubtitleDocument,
} from "./types";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_ITEMS = 5000;
const CHUNK_SIZE = 20;

type Phase = "idle" | "ready" | "analyzing" | "done" | "error";

export default function App() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [keyPreview, setKeyPreview] = useState("");
  const [emotions, setEmotions] =
    useState<EmotionDefinition[]>(loadEmotions);
  const [addEmojiThreshold, setAddEmojiThreshold] = useState(0.6);
  const [applyEnabled, setApplyEnabled] = useState(true);
  const [contextWindow, setContextWindow] = useState(5);

  const [fileName, setFileName] = useState("");
  const [subtitleDocument, setSubtitleDocument] =
    useState<SubtitleDocument | null>(null);
  const [items, setItems] = useState<AnalyzedItem[]>([]);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    getSettingsStatus()
      .then((status) => {
        setConfigured(status.configured);
        setKeyPreview(status.keyPreview);
      })
      .catch(() => setConfigured(false));
  }, []);

  useEffect(() => {
    saveEmotions(emotions);
  }, [emotions]);

  useEffect(() => {
    if (!subtitleDocument) {
      setItems([]);
      return;
    }

    const parsedItems = buildAnalysisItems(subtitleDocument, contextWindow);
    if (parsedItems.length > MAX_ITEMS) {
      setError(`字幕行数超过 ${MAX_ITEMS} 条上限，请拆分文件后重试。`);
      setItems([]);
      setPhase("idle");
      return;
    }

    if (parsedItems.length === 0) {
      setError("没有读取到可分析的字幕文本。");
      setItems([]);
      setPhase("idle");
      return;
    }

    setItems(parsedItems);
    setResults([]);
    setPhase("ready");
  }, [subtitleDocument, contextWindow]);

  async function handleFile(file: File) {
    setError("");

    const match = file.name.match(/\.(srt|txt)$/i);
    if (!match) {
      setError("仅支持 .srt 和 .txt 字幕文件。");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("文件超过 10 MB 限制。");
      return;
    }

    const raw = await file.text();
    const kind = match[1].toLowerCase() as "srt" | "txt";
    const parsed = parseSubtitleDocument(raw, kind);

    setFileName(file.name);
    setSubtitleDocument(parsed);
    setResults([]);
    setError("");
  }

  function reset() {
    abortRef.current?.abort();
    setFileName("");
    setSubtitleDocument(null);
    setItems([]);
    setResults([]);
    setPhase("idle");
    setProgress({ done: 0, total: 0 });
    setError("");
  }

  async function runAnalysis() {
    if (items.length === 0 || phase === "analyzing") {
      return;
    }

    if (emotions.length === 0) {
      setError("请至少添加一个情绪类别后再分析。");
      return;
    }

    setError("");
    setResults([]);
    setProgress({ done: 0, total: items.length });
    setPhase("analyzing");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      for (let start = 0; start < items.length; start += CHUNK_SIZE) {
        if (controller.signal.aborted) {
          break;
        }

        const chunk = items.slice(start, start + CHUNK_SIZE);
        const response = await analyzeTexts(
          chunk.map((item) => ({
            text: item.text,
            previous: item.context.previous,
            next: item.context.next,
          })),
          emotions,
        );

        setResults((previous) => {
          const next = [...previous];
          response.results.forEach((result) => {
            const position = start + result.index;
            if (position >= 0 && position < items.length) {
              next[position] = result;
            }
          });
          return next;
        });

        setProgress({
          done: Math.min(start + chunk.length, items.length),
          total: items.length,
        });
      }

      setPhase((current) => (current === "analyzing" ? "done" : current));
    } catch (caught) {
      if (!controller.signal.aborted) {
        setError(caught instanceof Error ? caught.message : String(caught));
        setPhase("error");
      }
    }
  }

  function cancelAnalysis() {
    abortRef.current?.abort();
    setPhase("done");
  }

  function exportFile() {
    if (!subtitleDocument || items.length === 0) {
      return;
    }

    const content = serializeDocument(subtitleDocument, items, results, {
      applyEnabled,
      addEmojiThreshold,
      emotions,
    });
    const extension = subtitleDocument.kind === "srt" ? ".srt" : ".txt";
    const baseName = fileName.replace(/\.(srt|txt)$/i, "");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = globalThis.document.createElement("a");
    anchor.href = url;
    anchor.download = `${baseName}-emoji${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleEmotionChange(
    id: string,
    patch: Partial<EmotionDefinition>,
  ) {
    setEmotions((current) =>
      current.map((emotion) =>
        emotion.id === id ? { ...emotion, ...patch } : emotion,
      ),
    );
  }

  function handleAddEmotion() {
    setEmotions((current) => [
      ...current,
      {
        id: createEmotionId(),
        label: "新情绪",
        color:
          PRESET_EMOTION_COLORS[
            current.length % PRESET_EMOTION_COLORS.length
          ],
        emojis: [],
        addEmoji: true,
        definition: "",
        includes: [],
        excludes: [],
        examples: [],
      },
    ]);
  }

  function handleRemoveEmotion(id: string) {
    setEmotions((current) =>
      current.filter((emotion) => emotion.id !== id),
    );
  }

  function handleMoveEmotion(sourceId: string, targetId: string) {
    setEmotions((current) =>
      swapEmotions(current, sourceId, targetId),
    );
  }

  const hasResults = results.length > 0;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand__mark">SRT</span>
          <span className="brand__name">SRTMood</span>
        </div>
        <div className="header-subtitle">用 Jev 为字幕标注情绪并追加 emoji</div>
      </header>

      <main className="app-main">
        <aside className="left-panel">
          <UploadZone onFile={handleFile} disabled={phase === "analyzing"} />
          <SettingsPanel
            configured={configured}
            keyPreview={keyPreview}
            onConfigured={setConfigured}
            emotions={emotions}
            onEmotionChange={handleEmotionChange}
            onEmotionAdd={handleAddEmotion}
            onEmotionRemove={handleRemoveEmotion}
            onEmotionMove={handleMoveEmotion}
            addEmojiThreshold={addEmojiThreshold}
            onAddEmojiThresholdChange={setAddEmojiThreshold}
            applyEnabled={applyEnabled}
            onApplyEnabledChange={setApplyEnabled}
            contextWindow={contextWindow}
            onContextWindowChange={setContextWindow}
          />
        </aside>

        <section className="right-panel" aria-label="分析结果">
          <div className="toolbar">
            <div className="toolbar__file">
              <FileDown size={18} aria-hidden="true" />
              <span>{fileName || "尚未选择文件"}</span>
            </div>
            <div className="toolbar__actions">
              {phase === "analyzing" ? (
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={cancelAnalysis}
                >
                  <Square size={15} aria-hidden="true" />
                  停止
                </button>
              ) : (
                <button
                  type="button"
                  className="button button--primary"
                  onClick={runAnalysis}
                  disabled={
                    items.length === 0 ||
                    configured !== true ||
                    emotions.length === 0
                  }
                >
                  {phase === "ready" ? (
                    <Play size={16} aria-hidden="true" />
                  ) : (
                    <Loader2
                      className=""
                      size={16}
                      aria-hidden="true"
                    />
                  )}
                  分析情绪
                </button>
              )}
              <button
                type="button"
                className="button button--secondary"
                onClick={exportFile}
                disabled={!hasResults}
              >
                <Download size={16} aria-hidden="true" />
                导出
              </button>
              <button
                type="button"
                className="button button--ghost"
                onClick={reset}
                disabled={items.length === 0}
              >
                <RotateCcw size={15} aria-hidden="true" />
                清空
              </button>
            </div>
          </div>

          {phase === "analyzing" ? (
            <div className="progress-card" role="status" aria-live="polite">
              <div className="progress-card__top">
                <span>正在判断情绪</span>
                <span>
                  {progress.done} / {progress.total}
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="error-banner" role="alert">
              {error}
            </div>
          ) : null}

          <div className="results-panel">
            <ResultsTable
              items={items}
              results={results}
              settings={{ applyEnabled, addEmojiThreshold, emotions }}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
