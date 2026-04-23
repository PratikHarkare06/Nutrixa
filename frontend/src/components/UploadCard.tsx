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
      className={`rounded-card border bg-[#1a202c] px-[32px] pb-[51px] pt-[52px] shadow-upload transition ${
        dragActive ? "border-[#7f86ec]" : "border-[#22314f]"
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
      <div className="mx-auto flex h-[161px] w-[161px] items-center justify-center rounded-full bg-[#0b1119]">
        <UploadCloudIcon className="h-[64px] w-[64px]" />
      </div>
      <div className="mt-[55px] text-center">
        <h2 className="text-[35px] font-[700] leading-[1.12] tracking-[-0.03em] text-[#f4f6fb]">
          Drag &amp; drop your food image here
        </h2>
        <p className="mt-[10px] text-[27px] font-[500] leading-[1.28] tracking-[-0.02em] text-[#f4f6fb]">
          or click to browse files
        </p>
      </div>
      <button
        className="mt-[52px] flex h-[100px] w-full items-center justify-center gap-[18px] rounded-[34px] bg-[#ff7a12] text-[27px] font-[700] leading-none tracking-[-0.03em] text-white disabled:cursor-not-allowed disabled:opacity-80"
        disabled={isUploading}
        type="button"
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? <SpinnerIcon className="h-[26px] w-[26px] animate-spin" /> : <ImagePlusIcon className="h-[31px] w-[31px] text-white" />}
        {isUploading ? "Uploading..." : "Choose Image"}
      </button>
      <p className="mt-[43px] text-center text-[20px] font-[700] leading-none tracking-[-0.02em] text-[#f4f6fb]">
        Supports JPG, JPEG, PNG • Max size: 10MB
      </p>
      {errorMessage ? (
        <div className="mt-[24px] rounded-[18px] border border-[#5b2430] bg-[#311821] px-[22px] py-[18px] text-[18px] font-[600] leading-[1.4] text-[#ffb4c2]">
          {errorMessage}
        </div>
      ) : null}
    </section>
  );
};
