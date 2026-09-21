import { useRef, useState } from "react";
import { FileText, UploadCloud } from "lucide-react";

interface UploadZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function UploadZone({ onFile, disabled = false }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function chooseFile(file: File | undefined) {
    if (!file || disabled) {
      return;
    }

    onFile(file);
  }

  return (
    <div
      className={`upload-zone${dragging ? " is-dragging" : ""}${
        disabled ? " is-disabled" : ""
      }`}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        chooseFile(event.dataTransfer.files[0]);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          chooseFile(inputRef.current?.files?.[0]);
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".srt,.txt"
        hidden
        onChange={(event) => chooseFile(event.target.files?.[0])}
      />
      <UploadCloud size={24} strokeWidth={1.7} aria-hidden="true" />
      <div className="upload-zone__title">拖入字幕文件</div>
      <div className="upload-zone__hint">或点击选择 .srt / .txt</div>
      <div className="upload-zone__meta">
        <FileText size={14} aria-hidden="true" />
        UTF-8 · 最多 10 MB · 5000 行
      </div>
    </div>
  );
}
