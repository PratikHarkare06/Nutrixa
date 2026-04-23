import axios, { AxiosError } from "axios";
import type { ApiErrorResponse, ProfileSuccessResponse, UserProfile } from "../types";

const profileApi = axios.create({
  baseURL: "http://localhost:5000/api",
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

export const getProfileErrorMessage = (error: unknown) =>
  getApiErrorMessage(error, "Failed to load profile. Retry.");

export const getSaveProfileErrorMessage = (error: unknown) =>
  getApiErrorMessage(error, "Failed to save profile. Retry.");
