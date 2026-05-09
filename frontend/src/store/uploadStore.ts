import { create } from "zustand";
import { getUploadErrorMessage, uploadImageRequest, scanBarcodeRequest, uploadPantryImageRequest } from "../services/uploadApi";
import type { UploadAnalysis, PantryAnalysis } from "../types";

type UploadState = {
  analysis: UploadAnalysis | null;
  pantryAnalysis: PantryAnalysis | null;
  dragActive: boolean;
  errorMessage: string;
  isUploading: boolean;
  progressMessage: string;
  controller: AbortController | null;
  setAnalysis: (analysis: UploadAnalysis | null) => void;
  setPantryAnalysis: (analysis: PantryAnalysis | null) => void;
  setDragActive: (dragActive: boolean) => void;
  clearError: () => void;
  cancelUpload: () => void;
  uploadImage: (file: File | null, mealType?: string) => Promise<boolean>;
  scanBarcode: (barcode: string) => Promise<boolean>;
  uploadPantryImage: (file: File | null) => Promise<boolean>;
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
  pantryAnalysis: null,
  dragActive: false,
  errorMessage: "",
  isUploading: false,
  progressMessage: "",
  controller: null,
  setAnalysis: (analysis) => set({ analysis }),
  setPantryAnalysis: (pantryAnalysis) => set({ pantryAnalysis }),
  setDragActive: (dragActive) => set({ dragActive }),
  clearError: () => set({ errorMessage: "", progressMessage: "" }),
  cancelUpload: () => {
    const controller = get().controller;
    if (controller) {
      controller.abort();
    }

    set({ controller: null, isUploading: false, progressMessage: "" });
  },
  uploadImage: async (file, mealType) => {
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
    const uploadId = crypto.randomUUID();

    set({
      controller,
      errorMessage: "",
      progressMessage: "Starting upload...",
      isUploading: true,
    });

    const eventSource = new EventSource(`http://localhost:5001/api/upload/progress/${uploadId}`);
    eventSource.onmessage = (event) => {
      try {
        if (event.data === "connected") return;
        const data = JSON.parse(event.data);
        if (data.message) {
          set({ progressMessage: data.message });
        }
      } catch (err) {}
    };

    try {
      const response = await uploadImageRequest(uploadFile, mealType, uploadId, controller.signal);

      eventSource.close();
      set({
        analysis: response.data,
        controller: null,
        errorMessage: "",
        progressMessage: "",
        isUploading: false,
      });

      return true;
    } catch (error) {
      eventSource.close();
      set({
        controller: null,
        errorMessage: getUploadErrorMessage(error),
        progressMessage: "",
        isUploading: false,
      });

      return false;
    }
  },
  scanBarcode: async (barcode: string) => {
    if (!barcode.trim()) {
      set({ errorMessage: "Please enter a valid barcode." });
      return false;
    }

    set({
      errorMessage: "",
      progressMessage: "Scanning barcode database...",
      isUploading: true,
    });

    try {
      const response = await scanBarcodeRequest(barcode.trim());
      set({
        analysis: response.data,
        errorMessage: "",
        progressMessage: "",
        isUploading: false,
      });
      return true;
    } catch (error) {
      set({
        errorMessage: getUploadErrorMessage(error),
        progressMessage: "",
        isUploading: false,
      });
      return false;
    }
  },
  uploadPantryImage: async (file) => {
    const validationMessage = getClientValidationMessage(file);

    if (validationMessage) {
      set({ errorMessage: validationMessage });
      return false;
    }

    if (!file) {
      set({ errorMessage: "Please choose an image to upload." });
      return false;
    }

    const controller = new AbortController();

    set({
      controller,
      errorMessage: "",
      progressMessage: "Analyzing pantry ingredients...",
      isUploading: true,
    });

    try {
      const response = await uploadPantryImageRequest(file, controller.signal);

      set({
        pantryAnalysis: response.data,
        controller: null,
        errorMessage: "",
        progressMessage: "",
        isUploading: false,
      });

      return true;
    } catch (error) {
      set({
        controller: null,
        errorMessage: getUploadErrorMessage(error),
        progressMessage: "",
        isUploading: false,
      });
      return false;
    }
  },
}));
