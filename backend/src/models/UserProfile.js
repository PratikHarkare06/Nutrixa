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
  id: "default-profile",
  updatedAt: new Date(0).toISOString(),
  weight: 62,
};

const mapUserProfileToResponse = (profile) => ({
  activityLevel: profile.activity_level,
  age: profile.age,
  dietaryRestrictions: profile.dietary_restrictions || [],
  email: profile.email,
  foodAllergies: profile.food_allergies || [],
  fullName: profile.name,
  gender: profile.gender,
  height: profile.height_cm,
  id: profile._id.toString(),
  updatedAt: profile.updated_at,
  weight: profile.weight_kg,
});

module.exports = {
  UserProfile,
  activityLevelOptions,
  allergyOptions,
  defaultUserProfile,
  dietaryRestrictionOptions,
  genderOptions,
  mapUserProfileToResponse,
};
