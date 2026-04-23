export type UploadAnalysis = {
  id: string;
  imageUrl: string;
  foods: Array<{
    name: string;
    confidence: number;
  }>;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  volume: number;
  weight: number;
  createdAt: string;
};

export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  age: number | null;
  gender: string;
  activityLevel: string;
  height: number;
  weight: number;
  dietaryRestrictions: string[];
  foodAllergies: string[];
  healthGoals?: string[];
  primaryGoal?: string;
  nutritionalTargets?: {
    calories: number;
    water: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
  };
  updatedAt: string;
};

export type HistoryPagination = {
  limit: number;
  page: number;
  total: number;
};

export type HistorySuccessResponse = {
  success: true;
  data: UploadAnalysis[];
  pagination: HistoryPagination;
};

export type UploadSuccessResponse = {
  success: true;
  data: UploadAnalysis;
};

export type ProfileSuccessResponse = {
  success: true;
  data: UserProfile;
};

export type ApiErrorResponse = {
  success?: false;
  error: {
    code:
      | "FILE_REQUIRED"
      | "INVALID_FILE_TYPE"
      | "FILE_TOO_LARGE"
      | "UPLOAD_FAILED"
      | "FETCH_FAILED"
      | "SAVE_FAILED"
      | "VALIDATION_FAILED";
    message: string;
  };
};
