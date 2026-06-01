import { create } from "zustand";
import { getUploadErrorMessage, uploadImageRequest, scanBarcodeRequest, uploadPantryImageRequest, uploadVoiceLogRequest, uploadReceiptRequest } from "../services/uploadApi";
import type { UploadAnalysis, PantryAnalysis } from "../types";

export type ScannedProduct = {
  barcode: string;
  name: string;
  timestamp: number;
};

type UploadState = {
  analysis: UploadAnalysis | null;
  pantryAnalysis: PantryAnalysis | null;
  dragActive: boolean;
  errorMessage: string;
  isUploading: boolean;
  progressMessage: string;
  controller: AbortController | null;
  scannedHistory: ScannedProduct[];
  setAnalysis: (analysis: UploadAnalysis | null) => void;
  setPantryAnalysis: (analysis: PantryAnalysis | null) => void;
  setDragActive: (dragActive: boolean) => void;
  clearError: () => void;
  cancelUpload: () => void;
  uploadImage: (file: File | null, mealType?: string) => Promise<boolean>;
  scanBarcode: (barcode: string) => Promise<boolean>;
  uploadPantryImage: (file: File | null) => Promise<boolean>;
  addIngredientsToPantry: (ingredients: string[]) => void;
  deductIngredientsFromPantry: (ingredients: string[]) => void;
  uploadVoiceLog: (transcript: string) => Promise<boolean>;
  addScannedProductToHistory: (barcode: string, name: string) => void;
  clearScannedHistory: () => void;
  uploadReceipt: (file: File | null) => Promise<string[] | null>;
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
  scannedHistory: (() => {
    try {
      const stored = localStorage.getItem("scannedHistory");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  })(),
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
      if (response && response.success && response.data && response.data.foods.length > 0) {
        const foodName = response.data.foods[0].name;
        get().addScannedProductToHistory(barcode.trim(), foodName);
      }
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
  addIngredientsToPantry: (ingredients) => {
    const currentAnalysis = get().pantryAnalysis;
    const defaultMockNames = ["Avocados", "Chicken Breast", "Quinoa", "Greek Yogurt", "Spinach"];
    const currentIngredients = currentAnalysis 
      ? currentAnalysis.identifiedIngredients 
      : defaultMockNames;

    const updatedIngredients = [...currentIngredients];
    ingredients.forEach(newIng => {
      if (!updatedIngredients.some(existing => existing.toLowerCase() === newIng.toLowerCase())) {
        updatedIngredients.push(newIng);
      }
    });

    set({
      pantryAnalysis: {
        identifiedIngredients: updatedIngredients,
        recipes: currentAnalysis ? currentAnalysis.recipes : []
      }
    });
  },
  deductIngredientsFromPantry: (ingredients) => {
    const currentAnalysis = get().pantryAnalysis;
    const defaultMockNames = ["Avocados", "Chicken Breast", "Quinoa", "Greek Yogurt", "Spinach"];
    const currentIngredients = currentAnalysis 
      ? currentAnalysis.identifiedIngredients 
      : defaultMockNames;

    // Filter out ingredients that match or partially match the deducted list
    const updatedIngredients = currentIngredients.filter(existing => 
      !ingredients.some(deduct => 
        existing.toLowerCase().includes(deduct.toLowerCase()) || 
        deduct.toLowerCase().includes(existing.toLowerCase())
      )
    );

    set({
      pantryAnalysis: {
        identifiedIngredients: updatedIngredients,
        recipes: currentAnalysis ? currentAnalysis.recipes : []
      }
    });
  },
  uploadVoiceLog: async (transcript) => {
    if (!transcript.trim()) {
      set({ errorMessage: "Voice log transcript cannot be empty." });
      return false;
    }

    set({
      errorMessage: "",
      progressMessage: "Analyzing voice log nutrition details...",
      isUploading: true,
    });

    try {
      const response = await uploadVoiceLogRequest(transcript.trim());
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
  addScannedProductToHistory: (barcode: string, name: string) => {
    const current = get().scannedHistory;
    const filtered = current.filter(p => p.barcode !== barcode);
    const updated = [
      { barcode, name, timestamp: Date.now() },
      ...filtered
    ].slice(0, 10);
    
    set({ scannedHistory: updated });
    try {
      localStorage.setItem("scannedHistory", JSON.stringify(updated));
    } catch (e) {}
  },
  clearScannedHistory: () => {
    set({ scannedHistory: [] });
    try {
      localStorage.removeItem("scannedHistory");
    } catch (e) {}
  },
  uploadReceipt: async (file) => {
    const validationMessage = getClientValidationMessage(file);

    if (validationMessage) {
      set({ errorMessage: validationMessage });
      return null;
    }

    if (!file) {
      set({ errorMessage: "Please choose an image to upload." });
      return null;
    }

    const controller = new AbortController();

    set({
      controller,
      errorMessage: "",
      progressMessage: "Analyzing receipt details...",
      isUploading: true,
    });

    try {
      const response = await uploadReceiptRequest(file, controller.signal);

      set({
        controller: null,
        errorMessage: "",
        progressMessage: "",
        isUploading: false,
      });

      return response.data;
    } catch (error) {
      set({
        controller: null,
        errorMessage: getUploadErrorMessage(error),
        progressMessage: "",
        isUploading: false,
      });
      return null;
    }
  },
}));
