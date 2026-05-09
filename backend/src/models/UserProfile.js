const mongoose = require("mongoose");

const dietaryRestrictionOptions = [
  "Vegetarian",
  "Gluten-Free",
  "Nut-Free",
  "Vegan",
];

const allergyOptions = ["Shellfish", "Eggs", "Soy", "Fish", "Sesame"];
const genderOptions = ["Female", "Male", "Non-Binary", "Prefer Not to Say"];
const activityLevelOptions = [
  "Sedentary",
  "Lightly Active",
  "Moderately Active",
  "Very Active",
];

const dietModeOptions = [
  "Balanced",
  "Keto (Low Carb)",
  "High Protein",
  "Low Fat"
];

const userProfileSchema = new mongoose.Schema(
  {
    activity_level: {
      enum: activityLevelOptions,
      required: true,
      trim: true,
      type: String,
    },
    age: {
      min: 1,
      required: true,
      type: Number,
    },
    dietary_restrictions: {
      default: [],
      type: [
        {
          enum: dietaryRestrictionOptions,
          trim: true,
          type: String,
        },
      ],
    },
    email: {
      lowercase: true,
      required: true,
      trim: true,
      type: String,
    },
    diet_mode: {
      enum: dietModeOptions,
      default: "Balanced",
      type: String,
    },
    food_allergies: {
      default: [],
      type: [
        {
          enum: allergyOptions,
          trim: true,
          type: String,
        },
      ],
    },
    gender: {
      enum: genderOptions,
      required: true,
      trim: true,
      type: String,
    },
    height_cm: {
      min: 1,
      required: true,
      type: Number,
    },
    name: {
      required: true,
      trim: true,
      type: String,
    },
    profile_key: {
      default: "primary",
      trim: true,
      type: String,
      unique: true,
    },
    weight_kg: {
      min: 1,
      required: true,
      type: Number,
    },
    diet_plan: {
      type: Object, // Will store the JSON structure of the 7-day plan
      default: null,
    },
    water_goal_ml: {
      type: Number,
      default: 2500,
    },
  },
  {
    collection: "users",
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    versionKey: false,
  },
);

const UserProfile =
  mongoose.models.UserProfile || mongoose.model("UserProfile", userProfileSchema);

const defaultUserProfile = {
  activityLevel: "Moderately Active",
  age: null,
  dietaryRestrictions: ["Vegetarian", "Gluten-Free"],
  email: "sarah.johnson@email.com",
  foodAllergies: ["Shellfish"],
  fullName: "Sarah Johnson",
  gender: "Female",
  height: 165,
  dietMode: "Balanced",
  id: "default-profile",
  updatedAt: new Date(0).toISOString(),
  weight: 62,
  waterGoalMl: 2500,
};

const calculateBMIAndCalories = (weight, heightCm, age, gender, activityLevel) => {
  if (!weight || !heightCm || !age || !gender || !activityLevel) return null;

  const heightM = heightCm / 100;
  const bmi = weight / (heightM * heightM);
  
  let bmiCategory = "Normal weight";
  if (bmi < 18.5) bmiCategory = "Underweight";
  else if (bmi >= 25 && bmi < 29.9) bmiCategory = "Overweight";
  else if (bmi >= 30) bmiCategory = "Obese";

  // BMR (Mifflin-St Jeor Equation)
  let bmr = 10 * weight + 6.25 * heightCm - 5 * age;
  bmr += gender === "Male" ? 5 : -161;

  const activityMultipliers = {
    "Sedentary": 1.2,
    "Lightly Active": 1.375,
    "Moderately Active": 1.55,
    "Very Active": 1.725,
  };
  
  const tdee = bmr * (activityMultipliers[activityLevel] || 1.2);

  return {
    bmi: parseFloat(bmi.toFixed(1)),
    bmiCategory,
    maintenanceCalories: Math.round(tdee),
    weightLossCalories: Math.round(tdee - 500),
    weightGainCalories: Math.round(tdee + 500),
  };
};

const mapUserProfileToResponse = (profile) => {
  const metrics = calculateBMIAndCalories(
    profile.weight_kg, 
    profile.height_cm, 
    profile.age, 
    profile.gender, 
    profile.activity_level
  );

  return {
    activityLevel: profile.activity_level,
    age: profile.age,
    dietaryRestrictions: profile.dietary_restrictions || [],
    email: profile.email,
    foodAllergies: profile.food_allergies || [],
    fullName: profile.name,
    gender: profile.gender,
    height: profile.height_cm,
    dietMode: profile.diet_mode || "Balanced",
    dietPlan: profile.diet_plan || null,
    id: profile._id.toString(),
    updatedAt: profile.updated_at,
    weight: profile.weight_kg,
    waterGoalMl: profile.water_goal_ml || 2500,
    ...metrics,
  };
};

module.exports = {
  UserProfile,
  activityLevelOptions,
  allergyOptions,
  defaultUserProfile,
  dietaryRestrictionOptions,
  genderOptions,
  dietModeOptions,
  mapUserProfileToResponse,
};
