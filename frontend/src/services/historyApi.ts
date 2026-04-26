import axios, { AxiosError } from "axios";
import type { ApiErrorResponse, HistorySuccessResponse } from "../types";

const historyApi = axios.create({
  baseURL: "http://localhost:5001/api",
  timeout: 10000,
});

type HistoryQueryParams = {
  limit?: number;
  page?: number;
  search?: string;
  sort?: "asc" | "desc";
  signal?: AbortSignal;
};

export const fetchHistoryRequest = async ({
  limit = 5,
  page = 1,
  search = "",
  sort = "desc",
  signal,
}: HistoryQueryParams): Promise<HistorySuccessResponse> => {
  const response = await historyApi.get<HistorySuccessResponse>("/history", {
    params: {
      limit,
      page,
      search: search || undefined,
      sort,
    },
    signal,
  });

  return response.data;
};

export const getHistoryErrorMessage = (error: unknown): string => {
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

  return "Failed to fetch history.";
};
