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
  ingredientsMacros?: Record<string, {
    // Per 100 g reference values (from API)
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    source?: string;
    // Caloric density (kcal per gram)
    caloriesPerGram?: number;
    proteinPerGram?: number;
    carbsPerGram?: number;
    fatPerGram?: number;
    fiberPerGram?: number;
    // Actual portion values (based on estimated weight)
    portionWeight?: number;
    portionCalories?: number;
    portionProtein?: number;
    portionCarbs?: number;
    portionFat?: number;
    portionFiber?: number;
  }>;
  volume: number;
  weight: number;
  createdAt: string;
  mealType?: string;
  mealCategory?: string;
  volumeSource?: "midas" | "density";
};

export type PantryRecipe = {
  name: string;
  description: string;
  prepTime: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string[];
};

export type PantryAnalysis = {
  identifiedIngredients: string[];
  recipes: PantryRecipe[];
};

export type MealPlan = {
  type: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type DailyDietPlan = {
  day: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  meals: MealPlan[];
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
  dietMode?: string;
  dietPlan?: DailyDietPlan[];
  workoutPlan?: DailyWorkoutPlan[];
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
  bmi?: number;
  bmiCategory?: string;
  maintenanceCalories?: number;
  weightLossCalories?: number;
  weightGainCalories?: number;
  waterGoalMl?: number;
  updatedAt: string;
};

export type DailyWater = {
  date: string;
  water_intake_ml: number;
};

export type ProgressLog = {
  _id: string;
  date: string;
  weight_kg: number;
  image_url: string | null;
  notes: string;
  created_at: string;
};

export type GroceryItem = {
  name: string;
  amount: string;
  checked: boolean;
};

export type GroceryCategory = {
  category: string;
  items: GroceryItem[];
};

export type Exercise = {
  name: string;
  sets: number;
  reps: string;
  restSecs: number;
  notes: string;
};

export type DailyWorkoutPlan = {
  day: string;
  focus: string;
  durationMins: number;
  isRestDay: boolean;
  exercises: Exercise[];
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
