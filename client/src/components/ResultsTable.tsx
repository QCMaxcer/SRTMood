import { AlertTriangle, Check, Inbox } from "lucide-react";
import { buildEmojiAssignments, EmojiSettings } from "../subtitles";
import type { AnalysisResult, AnalyzedItem } from "../types";

interface ResultsTableProps {
  items: AnalyzedItem[];
  results: AnalysisResult[];
  settings: EmojiSettings;
}

export function ResultsTable({
  items,
  results,
  settings,
}: ResultsTableProps) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <Inbox size={26} strokeWidth={1.5} aria-hidden="true" />
        <p>上传字幕后，这里会显示每条字幕的情绪判断。</p>
      </div>
    );
  }

  const assignments = buildEmojiAssignments(items, results, settings);

  return (
    <div className="results-wrap">
      <table className="results-table">
        <thead>
          <tr>
            <th>位置</th>
            <th>字幕内容</th>
            <th>情绪</th>
            <th>情绪置信度</th>
            <th>加表情判断</th>
            <th>处理后</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const result = results[index];
            const emoji = assignments.get(item.key) ?? null;
            const emotionDefinition = result?.emotion
              ? settings.emotions.find(
                  (emotion) => emotion.id === result.emotion,
                )
              : undefined;
            const finalText = emoji
              ? `${item.text} ${emoji}`
              : item.text;

            return (
              <tr key={item.key}>
                <td className="position-cell">
                  {item.kind === "srt" ? `#${item.sourceIndex + 1}` : `行 ${item.sourceIndex + 1}`}
                </td>
                <td className="text-cell">
                  <span className="text-cell__main">{item.text}</span>
                </td>
                <td>
                  {result?.error ? (
                    <span className="emotion-pill emotion-pill--error">
                      <AlertTriangle size={13} aria-hidden="true" />
                      错误
                    </span>
                  ) : (
                    <span
                      className={`emotion-pill emotion-pill--${result?.emotion ?? "none"}`}
                      style={
                        emotionDefinition
                          ? {
                              borderColor: emotionDefinition.color,
                              color: emotionDefinition.color,
                              backgroundColor: `${emotionDefinition.color}18`,
                            }
                          : undefined
                      }
                    >
                      {emotionDefinition?.label ??
                        result?.emotion ??
                        "未识别"}
                    </span>
                  )}
                </td>
                <td className="confidence-cell">
                  {result && !result.error
                    ? `${Math.round(result.confidence * 100)}%`
                    : "—"}
                </td>
                <td className="confidence-cell">
                  {result &&
                  !result.error &&
                  result.shouldAddEmoji !== null
                    ? `${Math.round(result.shouldAddEmoji * 100)}%`
                    : "—"}
                </td>
                <td className="applied-cell">
                  {emoji ? (
                    <span className="applied-text">
                      <Check size={14} aria-hidden="true" />
                      {finalText}
                    </span>
                  ) : (
                    <span className="applied-none">不追加</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
