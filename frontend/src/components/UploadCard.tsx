import { useRef } from "react";
import { ImagePlusIcon, SpinnerIcon, UploadCloudIcon } from "./icons";

type UploadCardProps = {
  dragActive: boolean;
  errorMessage: string;
  isUploading: boolean;
  onDragChange: (active: boolean) => void;
  onFileSelected: (file: File | null) => void;
};

export const UploadCard = ({
  dragActive,
  errorMessage,
  isUploading,
  onDragChange,
  onFileSelected,
}: UploadCardProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <section
      className={`relative w-full max-w-4xl mx-auto rounded-3xl border-2 border-dashed bg-panel/30 px-8 py-16 flex flex-col items-center justify-center transition-colors ${
        dragActive ? "border-primary bg-primary/5" : "border-panelBorder hover:border-gray-600 hover:bg-panel/50"
      }`}
      onDragEnter={(event) => {
        event.preventDefault();
        onDragChange(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        onDragChange(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        if (event.currentTarget.contains(event.relatedTarget as Node)) {
          return;
        }
        onDragChange(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDragChange(false);
        onFileSelected(event.dataTransfer.files[0] ?? null);
      }}
    >
      <input
        ref={inputRef}
        accept=".jpg,.jpeg,.png,image/png,image/jpeg"
        className="hidden"
        type="file"
        onChange={(event) => {
          onFileSelected(event.target.files?.[0] ?? null);
          event.currentTarget.value = "";
        }}
      />
      
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-900/30 mb-6">
        {/* Placeholder icon to match the dark red/brown circle */}
      </div>

      <h2 className="text-2xl font-semibold tracking-tight text-textMain mb-2">
        Drag &amp; drop your food image here
      </h2>
      <p className="text-sm text-textMuted mb-8">
        or click to browse files
      </p>

      <button
        className="px-6 py-2.5 rounded-lg bg-transparent text-sm font-medium text-textMain hover:bg-white/5 transition-colors disabled:opacity-50 flex items-center gap-2"
        disabled={isUploading}
        type="button"
        onClick={() => inputRef.current?.click()}
      >
        {isUploading && <SpinnerIcon className="h-4 w-4 animate-spin" />}
        {isUploading ? "Uploading..." : "Choose Image"}
      </button>

      <p className="mt-12 text-xs font-medium text-textMuted">
        Supports JPG, JPEG, PNG • Max size: 10MB
      </p>

      {errorMessage && (
        <div className="absolute bottom-4 rounded-lg border border-danger/50 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {errorMessage}
        </div>
      )}
    </section>
  );
};
