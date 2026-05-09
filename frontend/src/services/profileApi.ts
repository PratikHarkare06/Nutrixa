import axios, { AxiosError } from "axios";
import type { ApiErrorResponse, ProfileSuccessResponse, UserProfile, ProgressLog } from "../types";

const profileApi = axios.create({
  baseURL: "http://localhost:5001/api",
  timeout: 10000,
});

const getApiErrorMessage = (error: unknown, fallbackMessage: string) => {
  const axiosError = error as AxiosError<ApiErrorResponse>;

  if (axiosError.code === "ERR_CANCELED") {
    return "Request cancelled.";
  }

  if (axiosError.response?.data?.error?.message) {
    return axiosError.response.data.error.message;
  }

  if (!axiosError.response) {
    return "You are offline.";
  }

  return fallbackMessage;
};

export const fetchProfileRequest = async (
  signal?: AbortSignal,
): Promise<ProfileSuccessResponse> => {
  const response = await profileApi.get<ProfileSuccessResponse>("/profile", {
    signal,
  });

  return response.data;
};

export const saveProfileRequest = async (
  profile: Omit<UserProfile, "id" | "updatedAt">,
  signal?: AbortSignal,
): Promise<ProfileSuccessResponse> => {
  const response = await profileApi.post<ProfileSuccessResponse>("/profile", profile, {
    signal,
  });

  return response.data;
};

export const suggestMealsRequest = async (remainingCalories: number, remainingProtein: number, signal?: AbortSignal) => {
  const response = await profileApi.post("/profile/suggest", { remainingCalories, remainingProtein }, { signal });
  return response.data;
};

export const generateDietPlanRequest = async (signal?: AbortSignal) => {
  const response = await profileApi.post("/profile/diet-plan", {}, { signal });
  return response.data;
};

export const fetchProgressLogsRequest = async (): Promise<{ success: boolean; data: ProgressLog[] }> => {
  const response = await profileApi.get("/profile/progress");
  return response.data;
};

export const uploadProgressLogRequest = async (weight_kg: number, date: string, notes: string, file?: File | null): Promise<{ success: boolean; data: ProgressLog }> => {
  const formData = new FormData();
  formData.append("weight_kg", weight_kg.toString());
  formData.append("date", date);
  if (notes) formData.append("notes", notes);
  if (file) {
    formData.append("image", file);
  }

  const response = await profileApi.post("/profile/progress", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getProfileErrorMessage = (error: unknown) =>
  getApiErrorMessage(error, "Failed to load profile. Retry.");

export const getSaveProfileErrorMessage = (error: unknown) =>
  getApiErrorMessage(error, "Failed to save profile. Retry.");
