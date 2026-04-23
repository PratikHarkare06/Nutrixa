import { create } from "zustand";
import { getUploadErrorMessage, uploadImageRequest } from "../services/uploadApi";
import type { UploadAnalysis } from "../types";

type UploadState = {
  analysis: UploadAnalysis | null;
  dragActive: boolean;
  errorMessage: string;
  isUploading: boolean;
  controller: AbortController | null;
  setAnalysis: (analysis: UploadAnalysis | null) => void;
  setDragActive: (dragActive: boolean) => void;
  clearError: () => void;
  cancelUpload: () => void;
  uploadImage: (file: File | null) => Promise<boolean>;
};

const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
const maxFileSize = 10 * 1024 * 1024;

const getClientValidationMessage = (file: File | null): string => {
  if (!file) {
    return "Please choose an image to upload.";
  }

  if (!allowedTypes.includes(file.type)) {
    return "Unsupported file format. Please upload JPG, PNG, or JPEG.";
  }

  if (file.size > maxFileSize) {
    return "File size exceeds 10MB limit.";
  }

  return "";
};

export const useUploadStore = create<UploadState>((set, get) => ({
  analysis: null,
  dragActive: false,
  errorMessage: "",
  isUploading: false,
  controller: null,
  setAnalysis: (analysis) => set({ analysis }),
  setDragActive: (dragActive) => set({ dragActive }),
  clearError: () => set({ errorMessage: "" }),
  cancelUpload: () => {
    const controller = get().controller;
    if (controller) {
      controller.abort();
    }

    set({ controller: null, isUploading: false });
  },
  uploadImage: async (file) => {
    const validationMessage = getClientValidationMessage(file);

    if (validationMessage) {
      set({ errorMessage: validationMessage });
      return false;
    }

    if (!file) {
      set({ errorMessage: "Please choose an image to upload." });
      return false;
    }

    const uploadFile = file;
    const controller = new AbortController();

    set({
      controller,
      errorMessage: "",
      isUploading: true,
    });

    try {
      const response = await uploadImageRequest(uploadFile, controller.signal);

      set({
        analysis: response.data,
        controller: null,
        errorMessage: "",
        isUploading: false,
      });

      return true;
    } catch (error) {
      set({
        controller: null,
        errorMessage: getUploadErrorMessage(error),
        isUploading: false,
      });

      return false;
    }
  },
}));
