import { useRef, useState } from "react";
import { SpinnerIcon } from "./icons";

const MEAL_TYPES = [
  { id: "breakfast", label: "🌅 Breakfast" },
  { id: "lunch",     label: "☀️ Lunch" },
  { id: "dinner",    label: "🌙 Dinner" },
  { id: "snack",     label: "🍎 Snack" },
  { id: "auto",      label: "🤖 Let AI decide" },
] as const;

import { useUploadStore } from "../store/uploadStore";

type MealTypeId = typeof MEAL_TYPES[number]["id"];

type UploadCardProps = {
  dragActive: boolean;
  errorMessage: string;
  isUploading: boolean;
  onDragChange: (active: boolean) => void;
  onFileSelected: (file: File | null, mealType: string) => void;
};

export const UploadCard = ({
  dragActive,
  errorMessage,
  isUploading,
  onDragChange,
  onFileSelected,
}: UploadCardProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealTypeId>("auto");
  const progressMessage = useUploadStore((state) => state.progressMessage);

  const handleFile = (file: File | null) => {
    onFileSelected(file, selectedMealType === "auto" ? "" : selectedMealType);
  };

  return (
    <section
      className={`relative w-full max-w-4xl mx-auto rounded-3xl border-2 border-dashed bg-panel/30 px-8 py-12 flex flex-col items-center justify-center transition-colors ${
        dragActive ? "border-primary bg-primary/5" : "border-panelBorder hover:border-gray-600 hover:bg-panel/50"
      }`}
      onDragEnter={(event) => { event.preventDefault(); onDragChange(true); }}
      onDragOver={(event)  => { event.preventDefault(); onDragChange(true); }}
      onDragLeave={(event) => {
        event.preventDefault();
        if (event.currentTarget.contains(event.relatedTarget as Node)) return;
        onDragChange(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDragChange(false);
        handleFile(event.dataTransfer.files[0] ?? null);
      }}
    >
      <input
        ref={inputRef}
        accept=".jpg,.jpeg,.png,image/png,image/jpeg"
        className="hidden"
        type="file"
        onChange={(event) => {
          handleFile(event.target.files?.[0] ?? null);
          event.currentTarget.value = "";
        }}
      />

      {/* Meal type selector */}
      <div className="mb-8 w-full">
        <p className="text-xs font-semibold text-textMuted uppercase tracking-widest mb-3 text-center">
          What meal is this?
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {MEAL_TYPES.map((mt) => (
            <button
              key={mt.id}
              type="button"
              onClick={() => setSelectedMealType(mt.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                selectedMealType === mt.id
                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                  : "bg-panel border-panelBorder text-textMuted hover:border-gray-500 hover:text-textMain"
              }`}
            >
              {mt.label}
            </button>
          ))}
        </div>
        {selectedMealType !== "auto" && (
          <p className="text-center text-xs text-primary/70 mt-2">
            AI will use <span className="font-semibold capitalize">{selectedMealType}</span> context to improve portion estimates
          </p>
        )}
      </div>

      <h2 className="text-2xl font-semibold tracking-tight text-textMain mb-2">
        Drag &amp; drop your food image here
      </h2>
      <p className="text-sm text-textMuted mb-8">or click to browse files</p>

      <button
        className="px-6 py-2.5 rounded-lg bg-transparent text-sm font-medium text-textMain hover:bg-white/5 transition-colors disabled:opacity-50 flex items-center gap-2"
        disabled={isUploading}
        type="button"
        onClick={() => inputRef.current?.click()}
      >
        {isUploading && <SpinnerIcon className="h-4 w-4 animate-spin" />}
        {isUploading ? progressMessage || "Uploading..." : "Choose Image"}
      </button>

      <p className="mt-8 text-xs font-medium text-textMuted">
        Supports JPG, JPEG, PNG • Max size: 10MB
      </p>
      
      <p className="mt-2 text-xs font-medium text-primary/80 bg-primary/10 px-3 py-1.5 rounded-full">
        <span className="mr-1">💡</span> 
        <strong>Pro Tip:</strong> Place a coin next to your plate for 100% accurate weight scanning!
      </p>

      {/* Barcode Scanner UI */}
      <div className="mt-8 w-full max-w-sm pt-6 border-t border-panelBorder flex flex-col items-center">
        <p className="text-xs font-semibold text-textMuted uppercase tracking-widest mb-3">
          Or scan a package barcode
        </p>
        <div className="flex w-full gap-2">
          <input
            type="text"
            placeholder="e.g. 5449000000996"
            className="flex-1 rounded-lg border border-panelBorder bg-background px-4 py-2 text-sm text-textMain placeholder-textMuted focus:outline-none focus:border-primary"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const barcode = e.currentTarget.value;
                if (barcode) useUploadStore.getState().scanBarcode(barcode);
                e.currentTarget.value = "";
              }
            }}
          />
          <button
            onClick={(e) => {
              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
              const barcode = input.value;
              if (barcode) useUploadStore.getState().scanBarcode(barcode);
              input.value = "";
            }}
            disabled={isUploading}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            Scan
          </button>
        </div>
        <p className="text-[10px] text-textMuted mt-2 text-center">
          Powered by OpenFoodFacts. Just type the number and press Scan!
        </p>
      </div>

      {errorMessage && (
        <div className="absolute bottom-4 rounded-lg border border-danger/50 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {errorMessage}
        </div>
      )}
    </section>
  );
};

