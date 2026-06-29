// apiClient.ts — Central Axios instance with Firebase token auto-refresh
import axios from "axios";
import { API_BASE_URL } from "./apiConfig";
import { auth } from "../firebase";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000,
});

// Request interceptor — attach fresh Firebase ID token on every request
apiClient.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      try {
        // getIdToken(false) returns cached token; (true) forces refresh
        const token = await user.getIdToken(false);
        config.headers.Authorization = `Bearer ${token}`;
        localStorage.setItem("nutrixa_token", token);
      } catch (err) {
        console.warn("Failed to get Firebase ID token:", err);
      }
    } else {
      // Fallback to localStorage token (e.g., during initialization)
      const cached = localStorage.getItem("nutrixa_token");
      if (cached) {
        config.headers.Authorization = `Bearer ${cached}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401s and automatic retries for GET requests
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (response?.status === 401) {
      localStorage.removeItem("nutrixa_token");
      window.dispatchEvent(new Event("nutrixa_unauthorized"));
    }

    // Automatically retry GET requests on network or server-side (500+) errors
    if (config && config.method === "get") {
      config.__retryCount = config.__retryCount || 0;
      const MAX_RETRIES = 3;
      const RETRY_DELAY_BASE_MS = 1000;

      const isNetworkError = !response;
      const isServerError = response && response.status >= 500;

      if ((isNetworkError || isServerError) && config.__retryCount < MAX_RETRIES) {
        config.__retryCount += 1;
        const delay = RETRY_DELAY_BASE_MS * Math.pow(2, config.__retryCount - 1);
        console.warn(`[apiClient] GET failed (${error.message}). Retrying in ${delay}ms... (Attempt ${config.__retryCount}/${MAX_RETRIES})`);

        await new Promise((resolve) => setTimeout(resolve, delay));
        return apiClient(config);
      }
    }

    return Promise.reject(error);
  }
);
