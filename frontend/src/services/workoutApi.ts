import { apiClient as workoutApi } from "./apiClient";
import type { DailyWorkoutPlan } from "../types";

export const generateWorkoutPlanRequest = async (signal?: AbortSignal): Promise<{ success: boolean; data: DailyWorkoutPlan[] }> => {
  const response = await workoutApi.post("/workout/generate", {}, { signal });
  return response.data;
};

export const fetchWorkoutPlanRequest = async (signal?: AbortSignal): Promise<{ success: boolean; data: DailyWorkoutPlan[] | null }> => {
  const response = await workoutApi.get("/workout", { signal });
  return response.data;
};

export const completeWorkoutSessionRequest = async (
  workout_name: string,
  duration_mins: number,
  calories_burned: number,
  date?: string
): Promise<{
  success: boolean;
  data: {
    log: any;
    xp: number;
    level: number;
    levelUp: boolean;
    badgeUnlocked: string | null;
    unlockedBadges: string[];
  };
}> => {
  const response = await workoutApi.post("/workout/complete", {
    workout_name,
    duration_mins,
    calories_burned,
    date,
  });
  return response.data;
};

export const fetchWorkoutLogsRequest = async (): Promise<{ success: boolean; data: any[] }> => {
  const response = await workoutApi.get("/workout/history");
  return response.data;
};
