import { useState } from "react";
import type { FormEvent } from "react";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  GripVertical,
  KeyRound,
  Loader2,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { saveApiKey, testJevConnection } from "../api";
import {
  parseLines,
  PRESET_EMOTION_COLORS,
} from "../emotions";
import type { EmotionDefinition } from "../types";

interface EmotionRowProps {
  emotion: EmotionDefinition;
  dragging: boolean;
  dragOver: boolean;
  onEmotionChange: (
    id: string,
    patch: Partial<EmotionDefinition>,
  ) => void;
  onEmotionRemove: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragHover: (id: string) => void;
  onDrop: (sourceId: string, targetId: string) => void;
}

function EmotionRow({
  emotion,
  dragging,
  dragOver,
  onEmotionChange,
  onEmotionRemove,
  onDragStart,
  onDragEnd,
  onDragHover,
  onDrop,
}: EmotionRowProps) {
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState(false);

  function addEmoji(event: FormEvent) {
    event.preventDefault();
    const value = draft.trim();
    if (!value) {
      return;
    }

    onEmotionChange(emotion.id, {
      emojis: [...emotion.emojis, value],
    });
    setDraft("");
  }

  function removeEmoji(index: number) {
    onEmotionChange(emotion.id, {
      emojis: emotion.emojis.filter((_, itemIndex) => itemIndex !== index),
    });
  }

  return (
    <div
      className={`emotion-item${dragging ? " is-dragging" : ""}${
        dragOver ? " is-drag-over" : ""
      }`}
      style={{ borderLeftColor: emotion.color }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        onDragHover(emotion.id);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          onDragHover("");
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        const sourceId = event.dataTransfer.getData("text/plain");
        if (sourceId) {
          onDrop(sourceId, emotion.id);
        }
        onDragEnd();
      }}
    >
      <div
        className="emotion-item__summary"
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setExpanded((current) => !current);
          }
        }}
        aria-expanded={expanded}
      >
        <span
          className="emotion-drag-handle"
          draggable
          onDragStart={(event) => {
            event.stopPropagation();
            event.dataTransfer.setData("text/plain", emotion.id);
            event.dataTransfer.effectAllowed = "move";
            onDragStart(emotion.id);
          }}
          onDragEnd={(event) => {
            event.stopPropagation();
            onDragEnd();
          }}
          onClick={(event) => event.stopPropagation()}
          title="拖拽排序"
          aria-label="拖拽排序"
        >
          <GripVertical size={14} aria-hidden="true" />
        </span>
        <span
          className="emotion-color-dot"
          style={{ backgroundColor: emotion.color }}
        />
        <span className="emotion-item__summary-label">
          {emotion.label || "未命名情绪"}
        </span>
        <span className="emotion-item__summary-emojis">
          {emotion.emojis.length > 0
            ? emotion.emojis.slice(0, 3).join(" ")
            : "无 emoji"}
        </span>
        <span className="emotion-item__summary-add">
          {emotion.addEmoji ? "加" : "不加"}
        </span>
        <ChevronDown
          className={expanded ? "is-open" : ""}
          size={16}
          aria-hidden="true"
        />
      </div>

      <div
        className={`emotion-item__editor-wrap${
          expanded ? " is-open" : ""
        }`}
        aria-hidden={!expanded}
      >
        <div className="emotion-item__editor">
          <div className="emotion-item__editor-inner">
            <div className="emotion-item__top">
              <input
                type="color"
                className="emotion-color-input"
                value={emotion.color}
                onChange={(event) =>
                  onEmotionChange(emotion.id, { color: event.target.value })
                }
                aria-label={`${emotion.label} 颜色`}
              />
              <input
                type="text"
                className="emotion-item__label-input"
                value={emotion.label}
                onChange={(event) =>
                  onEmotionChange(emotion.id, { label: event.target.value })
                }
                aria-label="情绪名称"
              />
              <label className="emotion-item__add" title="追加 emoji">
                <input
                  type="checkbox"
                  checked={emotion.addEmoji}
                  onChange={(event) =>
                    onEmotionChange(emotion.id, {
                      addEmoji: event.target.checked,
                    })
                  }
                />
                <span>加</span>
              </label>
              <button
                type="button"
                className="icon-button"
                onClick={() => onEmotionRemove(emotion.id)}
                aria-label={`删除 ${emotion.label}`}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="emotion-color-presets">
              {PRESET_EMOTION_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`color-preset${
                    emotion.color.toUpperCase() === color ? " is-active" : ""
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => onEmotionChange(emotion.id, { color })}
                  aria-label={`使用颜色 ${color}`}
                  title={color}
                />
              ))}
            </div>

            <div className="emotion-item__emojis">
              {emotion.emojis.length > 0 ? (
                emotion.emojis.map((emoji, index) => (
                  <span className="emoji-chip" key={`${emoji}-${index}`}>
                    <span>{emoji}</span>
                    <button
                      type="button"
                      onClick={() => removeEmoji(index)}
                      aria-label={`删除 emoji ${emoji}`}
                    >
                      <X size={12} aria-hidden="true" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="emotion-item__none">暂无 emoji</span>
              )}

              {emotion.addEmoji ? (
                <form className="emoji-add" onSubmit={addEmoji}>
                  <input
                    type="text"
                    value={draft}
                    maxLength={32}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="添加 emoji"
                    aria-label={`给 ${emotion.label} 添加 emoji`}
                  />
                  <button type="submit" aria-label="添加 emoji">
                    <Plus size={14} aria-hidden="true" />
                  </button>
                </form>
              ) : null}
            </div>

            <div className="emotion-boundary">
              <div className="emotion-boundary__title">语义边界</div>
              <label>
                <span>定义</span>
                <textarea
                  value={emotion.definition}
                  rows={2}
                  onChange={(event) =>
                    onEmotionChange(emotion.id, {
                      definition: event.target.value,
                    })
                  }
                  placeholder="例如：真正觉得好笑、幽默或轻松"
                />
              </label>
              <label>
                <span>包含</span>
                <textarea
                  value={emotion.includes.join("\n")}
                  rows={2}
                  onChange={(event) =>
                    onEmotionChange(emotion.id, {
                      includes: parseLines(event.target.value),
                    })
                  }
                  placeholder="每行一条，例如：笑话 / 梗 / 轻松的玩笑"
                />
              </label>
              <label>
                <span>排除</span>
                <textarea
                  value={emotion.excludes.join("\n")}
                  rows={2}
                  onChange={(event) =>
                    onEmotionChange(emotion.id, {
                      excludes: parseLines(event.target.value),
                    })
                  }
                  placeholder="每行一条，例如：讽刺 / 嘲笑 / 荒谬 / 轻蔑"
                />
              </label>
              <label>
                <span>示例</span>
                <textarea
                  value={emotion.examples.join("\n")}
                  rows={2}
                  onChange={(event) =>
                    onEmotionChange(emotion.id, {
                      examples: parseLines(event.target.value),
                    })
                  }
                  placeholder="每行一条字幕示例"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SettingsPanelProps {
  configured: boolean | null;
  keyPreview: string;
  onConfigured: (configured: boolean) => void;
  emotions: EmotionDefinition[];
  onEmotionChange: (
    id: string,
    patch: Partial<EmotionDefinition>,
  ) => void;
  onEmotionAdd: () => void;
  onEmotionRemove: (id: string) => void;
  onEmotionMove: (sourceId: string, targetId: string) => void;
  addEmojiThreshold: number;
  onAddEmojiThresholdChange: (value: number) => void;
  applyEnabled: boolean;
  onApplyEnabledChange: (value: boolean) => void;
  contextWindow: number;
  onContextWindowChange: (value: number) => void;
}

export function SettingsPanel({
  configured,
  keyPreview,
  onConfigured,
  emotions,
  onEmotionChange,
  onEmotionAdd,
  onEmotionRemove,
  onEmotionMove,
  addEmojiThreshold,
  onAddEmojiThresholdChange,
  applyEnabled,
  onApplyEnabledChange,
  contextWindow,
  onContextWindowChange,
}: SettingsPanelProps) {
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  async function handleSaveKey(event: FormEvent) {
    event.preventDefault();
    if (!apiKey.trim()) {
      setMessage({ text: "请输入 API Key", type: "error" });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await saveApiKey(apiKey.trim());
      setApiKey("");
      onConfigured(true);
      setMessage({ text: "已保存并校验", type: "success" });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "保存失败",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testJevConnection();
      setTestResult({
        ok: true,
        text: `Jev 正常 · ${result.model} · ${result.latencyMs} ms`,
      });
    } catch (error) {
      setTestResult({
        ok: false,
        text: error instanceof Error ? error.message : "测试失败",
      });
    } finally {
      setTesting(false);
    }
  }

  return (
    <section className="panel" aria-label="设置">
      <div className="panel__header">
        <h2>设置</h2>
        <span
          className={`status-pill${
            configured ? " is-ok" : configured === false ? " is-missing" : ""
          }`}
        >
          {configured === null
            ? "读取中"
            : configured
              ? "API 已就绪"
              : "需要 API Key"}
        </span>
      </div>

      <form className="api-form" onSubmit={handleSaveKey}>
        <label htmlFor="api-key" className="field-label">
          <KeyRound size={15} aria-hidden="true" />
          TypeSafe API Key
        </label>
        <div className="api-form__row">
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder={
              configured && keyPreview ? keyPreview : "粘贴你的 API Key"
            }
            autoComplete="off"
          />
          <button type="submit" className="button button--primary" disabled={saving}>
            {saving ? (
              <Loader2 className="spin" size={16} aria-hidden="true" />
            ) : (
              <CheckCircle2 size={16} aria-hidden="true" />
            )}
            保存
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={handleTest}
            disabled={testing || configured !== true}
          >
            {testing ? (
              <Loader2 className="spin" size={16} aria-hidden="true" />
            ) : (
              <Activity size={16} aria-hidden="true" />
            )}
            测试
          </button>
        </div>
        {testResult ? (
          <p
            className={`field-message field-message--${testResult.ok ? "success" : "error"}`}
          >
            {testResult.text}
          </p>
        ) : null}
        {message ? (
          <p
            className={`field-message field-message--${message.type}`}
          >
            {message.text}
          </p>
        ) : null}
      </form>

      <div className="setting-block">
        <div className="setting-line setting-line--stack">
          <div className="setting-line__row">
            <label htmlFor="context-window" className="setting-label">
              <BookOpen size={16} aria-hidden="true" />
              上下文窗口
            </label>
            <output className="threshold-value">
              前后各 {contextWindow} 句
            </output>
          </div>
          <input
            id="context-window"
            type="range"
            min="0"
            max="5"
            step="1"
            value={contextWindow}
            onChange={(event) =>
              onContextWindowChange(Number(event.target.value))
            }
          />
        </div>
      </div>

      <div className="setting-block">
        <div className="setting-line">
          <label htmlFor="apply-toggle" className="setting-label">
            <Sparkles size={16} aria-hidden="true" />
            应用 emoji 到字幕后方
          </label>
          <button
            id="apply-toggle"
            type="button"
            role="switch"
            aria-checked={applyEnabled}
            className={`switch${applyEnabled ? " is-on" : ""}`}
            onClick={() => onApplyEnabledChange(!applyEnabled)}
          >
            <span />
          </button>
        </div>

        <div className="setting-line setting-line--stack">
          <div className="setting-line__row">
            <label htmlFor="add-emoji-threshold" className="setting-label">
              <SlidersHorizontal size={16} aria-hidden="true" />
              加表情阈值
            </label>
            <output className="threshold-value">
              {Math.round(addEmojiThreshold * 100)}%
            </output>
          </div>
          <input
            id="add-emoji-threshold"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={addEmojiThreshold}
            onChange={(event) =>
              onAddEmojiThresholdChange(Number(event.target.value))
            }
          />
        </div>
      </div>

      <div className="setting-block">
        <div className="setting-label">
          <Sparkles size={16} aria-hidden="true" />
          情绪与 emoji
        </div>
        <div className="emotion-editor">
          {emotions.map((emotion) => (
            <EmotionRow
              key={emotion.id}
              emotion={emotion}
              dragging={draggingId === emotion.id}
              dragOver={
                dragOverId === emotion.id && draggingId !== emotion.id
              }
              onEmotionChange={onEmotionChange}
              onEmotionRemove={onEmotionRemove}
              onDragStart={setDraggingId}
              onDragEnd={() => {
                setDraggingId(null);
                setDragOverId(null);
              }}
              onDragHover={setDragOverId}
              onDrop={(sourceId, targetId) => {
                onEmotionMove(sourceId, targetId);
                setDraggingId(null);
                setDragOverId(null);
              }}
            />
          ))}
          <button
            type="button"
            className="button button--ghost emotion-add"
            onClick={onEmotionAdd}
          >
            <Plus size={16} aria-hidden="true" />
            添加情绪
          </button>
        </div>
        <p className="emotion-editor__hint">
          每个 emoji 单独添加，分析时会轮流使用。建议保留至少一个取消“加”的类别。
        </p>
      </div>
    </section>
  );
}
