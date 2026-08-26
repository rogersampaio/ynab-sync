import { useRef } from "react";
import type { AmexParseResult } from "../types/amex";

interface FileUploadProps {
  onFile: (file: File) => void;
  isLoading: boolean;
  result: AmexParseResult | null;
  selectedFileName: string | null;
  onClear: () => void;
}

export function FileUpload({
  onFile,
  isLoading,
  result,
  selectedFileName,
  onClear,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  const handleClick = () => inputRef.current?.click();

  return (
    <section className="file-upload" aria-labelledby="upload-heading">
      <h2 id="upload-heading">Amex file</h2>
      <p className="file-upload-hint">
        Upload a file exported from Amex (format support to be added).
      </p>

      <div
        className="dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.txt,.xlsx"
          onChange={handleChange}
          className="dropzone-input"
          aria-label="Choose Amex file"
        />
        {isLoading ? (
          <span className="dropzone-text">Reading file…</span>
        ) : selectedFileName ? (
          <span className="dropzone-text dropzone-file">
            {selectedFileName}
            <button
              type="button"
              className="dropzone-clear"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              aria-label="Clear file"
            >
              Clear
            </button>
          </span>
        ) : (
          <span className="dropzone-text">
            Drop a file here or click to choose
          </span>
        )}
      </div>

      {result && (
        <div className="parse-result" role="status">
          {result.transactions.length > 0 && (
            <p className="parse-count">
              {result.transactions.length} transaction(s) found.
            </p>
          )}
          {result.errors.length > 0 && (
            <ul className="parse-errors">
              {result.errors.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
