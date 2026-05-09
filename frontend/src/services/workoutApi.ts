import axios from "axios";
import type { DailyWorkoutPlan } from "../types";

const workoutApi = axios.create({
  baseURL: "http://localhost:5001/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const generateWorkoutPlanRequest = async (signal?: AbortSignal): Promise<{ success: boolean; data: DailyWorkoutPlan[] }> => {
  const response = await workoutApi.post("/workout/generate", {}, { signal });
  return response.data;
};

export const fetchWorkoutPlanRequest = async (signal?: AbortSignal): Promise<{ success: boolean; data: DailyWorkoutPlan[] | null }> => {
  const response = await workoutApi.get("/workout", { signal });
  return response.data;
};
