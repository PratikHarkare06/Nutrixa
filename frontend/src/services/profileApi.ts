import axios, { AxiosError } from "axios";
import type { ApiErrorResponse, ProfileSuccessResponse, UserProfile, ProgressLog, GroceryCategory, PantryRecipe, SleepLog, DailyDietPlan } from "../types";
import { API_BASE_URL } from "./apiConfig";

const profileApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 120s — allows for LLM generation and Nvidia NIM analysis
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

export const generateGroceryListRequest = async (signal?: AbortSignal): Promise<{ success: boolean; data: GroceryCategory[] }> => {
  const response = await profileApi.post("/profile/grocery-list", {}, { signal });
  return response.data;
};

export const generatePantryRecipesRequest = async (
  ingredients: string[],
  signal?: AbortSignal,
): Promise<{ success: boolean; data: PantryRecipe[] }> => {
  const response = await profileApi.post("/profile/pantry-recipes", { ingredients }, { signal });
  return response.data;
};

export const uploadProgressLogRequest = async (
  weight_kg: number, 
  date: string, 
  notes: string, 
  file?: File | null,
  body_fat_pct?: number | null,
  muscle_mass_kg?: number | null
): Promise<{ success: boolean; data: ProgressLog }> => {
  const formData = new FormData();
  formData.append("weight_kg", weight_kg.toString());
  formData.append("date", date);
  if (notes) formData.append("notes", notes);
  if (body_fat_pct !== undefined && body_fat_pct !== null) {
    formData.append("body_fat_pct", body_fat_pct.toString());
  }
  if (muscle_mass_kg !== undefined && muscle_mass_kg !== null) {
    formData.append("muscle_mass_kg", muscle_mass_kg.toString());
  }
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

export const fetchAllergenSubstitutesRequest = async (
  ingredients: string[],
  allergies: string[],
  restrictions: string[],
  signal?: AbortSignal,
): Promise<{ success: boolean; data: Array<{ ingredient: string; reason: string; substitutes: string[] }> }> => {
  const response = await profileApi.post("/profile/allergen-substitutes", {
    ingredients,
    allergies,
    restrictions,
  }, { signal });
  return response.data;
};

export const fetchDashboardStatsRequest = async (): Promise<{
  success: boolean;
  data: {
    workoutIntensity: "rest" | "light" | "moderate" | "intense";
    waterGoal: number;
    hydrationML: number;
    hydrationStreak: number;
    weeklyHydration: number[];
    mealStreak: number;
    mealLogsWeek: boolean[];
    consistencyScore: number;
  };
}> => {
  const response = await profileApi.get("/profile/dashboard-stats");
  return response.data;
};

export const updateWorkoutIntensityRequest = async (intensity: string): Promise<{ success: boolean; data: UserProfile }> => {
  const response = await profileApi.post("/profile/workout-intensity", { intensity });
  return response.data;
};

export const modifyDietPlanMealRequest = async (
  day: string,
  mealIndex: number,
  prompt: string
): Promise<{ success: boolean; data: DailyDietPlan[] }> => {
  const response = await profileApi.post("/profile/diet-plan/modify-meal", { day, mealIndex, prompt });
  return response.data;
};

export const fetchSleepLogsRequest = async (): Promise<{ success: boolean; data: SleepLog[] }> => {
  const response = await profileApi.get("/sleep");
  return response.data;
};

export const logSleepRequest = async (payload: {
  date: string;
  duration_hours: number;
  quality_score: number;
  deep_sleep_hours?: number;
  rem_sleep_hours?: number;
  notes?: string;
}): Promise<{ success: boolean; data: SleepLog }> => {
  const response = await profileApi.post("/sleep", payload);
  return response.data;
};

export const fetchSleepInsightsRequest = async (): Promise<{ success: boolean; data: string }> => {
  const response = await profileApi.post("/sleep/insights");
  return response.data;
};

export const getProfileErrorMessage = (error: unknown) =>
  getApiErrorMessage(error, "Failed to load profile. Retry.");

export const getSaveProfileErrorMessage = (error: unknown) =>
  getApiErrorMessage(error, "Failed to save profile. Retry.");
