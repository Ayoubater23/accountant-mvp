import { useCallback, useRef, useState } from "react";

const ACCEPT =
  "application/pdf,image/png,image/jpeg,image/jpg,image/tif,image/tiff,.pdf,.png,.jpg,.jpeg,.tif,.tiff";

export default function UploadZone({ onFile, disabled, error }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const pickFile = useCallback(
    (fileList) => {
      if (disabled || !fileList?.length) return;
      const file = fileList[0];
      onFile?.(file);
    },
    [disabled, onFile]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      pickFile(e.dataTransfer.files);
    },
    [pickFile]
  );

  const onChangeInput = (e) => {
    pickFile(e.target.files);
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragOver(false);
          }
        }}
        onDrop={onDrop}
        className={`
          flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition
          ${
            disabled
              ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-500"
              : dragOver
                ? "border-brand-500 bg-brand-50 text-brand-900 dark:bg-brand-950/50 dark:text-brand-100"
                : "border-slate-300 bg-white text-slate-600 hover:border-brand-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-500 dark:hover:bg-slate-800"
          }
        `}
      >
        <p className="text-sm font-medium">
          Glissez-déposez un PDF ou une image ici
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          PDF, PNG, JPEG, TIFF — ou cliquez pour parcourir
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          disabled={disabled}
          onChange={onChangeInput}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
