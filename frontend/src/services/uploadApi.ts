import axios, { AxiosError } from "axios";
import type { ApiErrorResponse, UploadSuccessResponse } from "../types";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 10000,
});

export const uploadImageRequest = async (
  file: File,
  signal?: AbortSignal,
): Promise<UploadSuccessResponse> => {
  const formData = new FormData();
  formData.append("image", file);

  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await api.post<UploadSuccessResponse>("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        signal,
      });

      return response.data;
    } catch (error) {
      lastError = error;
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const isNetworkFailure = !axiosError.response && axiosError.code !== "ERR_CANCELED";

      if (!isNetworkFailure || attempt === 1) {
        break;
      }
    }
  }

  throw lastError;
};

export const getUploadErrorMessage = (error: unknown): string => {
  const axiosError = error as AxiosError<ApiErrorResponse>;

  if (axiosError.code === "ERR_CANCELED") {
    return "Upload cancelled.";
  }

  if (axiosError.response?.data?.error?.message) {
    return axiosError.response.data.error.message;
  }

  if (!axiosError.response) {
    return "You are offline.";
  }

  return "Upload failed. Please try again.";
};
