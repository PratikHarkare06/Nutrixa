import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  CheckIcon,
  ChevronDownIcon,
  HomeIcon,
  UserIcon,
} from "../components/icons";
import {
  fetchProfileRequest,
  getProfileErrorMessage,
  getSaveProfileErrorMessage,
  saveProfileRequest,
} from "../services/profileApi";
import type { UserProfile } from "../types";
import { ProgressTracker } from "../components/ProgressTracker";
import { BadgesShowcase } from "../components/BadgesShowcase";

type ProfilePageProps = {
  onNavigate: (nextPath: string) => void;
};

type ProfileFormValues = Omit<UserProfile, "id" | "updatedAt">;

const genderOptions = ["Female", "Male", "Non-Binary", "Prefer Not to Say"];
const activityOptions = [
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

const primaryGoalOptions = [
  "Weight Loss",
  "Weight Maintenance",
  "Muscle Gain",
  "Improve General Health",
  "Manage Health Condition",
];

const defaultValues: ProfileFormValues = {
  activityLevel: "Moderately Active",
  age: 28,
  dietaryRestrictions: ["Vegetarian", "High Protein"],
  email: "sarah.johnson@email.com",
  foodAllergies: [],
  fullName: "Sarah Johnson",
  gender: "Female",
  height: 165,
  dietMode: "Balanced",
  weight: 62,
  healthGoals: [],
  primaryGoal: "Weight Maintenance",
  nutritionalTargets: {
    calories: 2100,
    water: 2.5,
    protein: 25,
    carbs: 45,
    fat: 30,
    fiber: 25,
    sodium: 2000,
  },
  xp: 0,
  level: 1,
  unlockedBadges: [],
};

const mapProfileToFormValues = (profile: UserProfile): ProfileFormValues => ({
  activityLevel: profile.activityLevel || "Moderately Active",
  age: profile.age,
  dietaryRestrictions: profile.dietaryRestrictions || [],
  email: profile.email || "",
  foodAllergies: profile.foodAllergies || [],
  fullName: profile.fullName || "",
  gender: profile.gender || "Female",
  height: profile.height || 165,
  dietMode: profile.dietMode || "Balanced",
  weight: profile.weight || 62,
  healthGoals: profile.healthGoals || [],
  primaryGoal: profile.primaryGoal || "Weight Maintenance",
  nutritionalTargets: profile.nutritionalTargets || defaultValues.nutritionalTargets,
  xp: profile.xp || 0,
  level: profile.level || 1,
  unlockedBadges: profile.unlockedBadges || [],
});

export const ProfilePage = ({ onNavigate }: ProfilePageProps) => {
  const {
    formState: { errors, isSubmitting, isDirty },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    watch,
    getValues,
  } = useForm<ProfileFormValues>({
    defaultValues,
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");
  
  // App views state
  const [isEditing, setIsEditing] = useState(false);
  const [showTracker, setShowTracker] = useState(false);

  // Profile preferences (mock & DB synced)
  const dietaryRestrictions = watch("dietaryRestrictions") || [];
  const [nutAllergyWarning, setNutAllergyWarning] = useState(true);

  // Targets values
  const calTarget = watch("nutritionalTargets.calories") || 2100;
  const proteinTarget = watch("nutritionalTargets.protein") || 25;
  const carbsTarget = watch("nutritionalTargets.carbs") || 45;
  const xp = watch("xp") || 0;
  const level = watch("level") || 1;
  const unlockedBadges = watch("unlockedBadges") || [];
  
  // Calculate macronutrient values in grams for visual targets
  const proteinGrams = Math.round((calTarget * (proteinTarget / 100)) / 4);
  const carbsGrams = Math.round((calTarget * (carbsTarget / 100)) / 4);

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetchProfileRequest(controller.signal);
        reset(mapProfileToFormValues(response.data));
      } catch (error) {
        if ((error as { code?: string }).code !== "ERR_CANCELED") {
          setErrorMessage(getProfileErrorMessage(error));
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();

    return () => controller.abort();
  }, [reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    setErrorMessage("");
    setSaveMessage("");

    if (!values.fullName.trim() || !values.email.trim() || !values.age || !values.height || !values.weight) {
      setError("root", { message: "Please fill all required fields.", type: "manual" });
      return;
    }

    try {
      const response = await saveProfileRequest({
        ...values,
        email: values.email.trim(),
        fullName: values.fullName.trim(),
      });

      reset(mapProfileToFormValues(response.data));
      setSaveMessage("Profile saved successfully.");
      setIsEditing(false);
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      setErrorMessage(getSaveProfileErrorMessage(error));
    }
  };

  const toggleRestriction = (tag: string) => {
    const nextRestrictions = dietaryRestrictions.includes(tag)
      ? dietaryRestrictions.filter((t) => t !== tag)
      : [...dietaryRestrictions, tag];
    setValue("dietaryRestrictions", nextRestrictions, { shouldDirty: true });
  };



  if (isLoading) {
    return (
      <div className="flex-1 min-h-screen bg-background pb-24 px-8 pt-8 animate-pulse">
        <header className="max-w-6xl mx-auto w-full flex justify-between items-center mb-8">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-[#E2E4DC] rounded-xl" />
            <div className="h-4 w-72 bg-[#E2E4DC]/60 rounded-lg" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-28 bg-[#E2E4DC] rounded-full" />
            <div className="h-10 w-10 bg-[#E2E4DC] rounded-full" />
          </div>
        </header>
        <main className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8">
          <div className="space-y-6">
            <div className="bg-white border border-border rounded-[24px] h-80" />
            <div className="bg-white border border-border rounded-[24px] h-96" />
          </div>
          <div className="space-y-6">
            <div className="bg-white border border-border rounded-[24px] h-64" />
            <div className="bg-white border border-border rounded-[24px] h-48" />
          </div>
        </main>
      </div>
    );
  }

  // Dietary Preferences Tags from Profile.png
  const preferenceTags = [
    "Vegetarian",
    "Gluten Free",
    "High Protein",
    "Low Carb",
    "Dairy Free",
    "Keto",
  ];

  return (
    <div className="flex-1 min-h-screen bg-background relative overflow-y-auto pb-24 px-4 sm:px-8 pt-8">
      {/* Sub-view Header */}
      <header className="max-w-6xl mx-auto w-full flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-textHeading tracking-tight">
            {showTracker ? "Transformation & Progress" : "My Profile"}
          </h1>
          <p className="text-textMuted text-sm mt-1">
            {showTracker
              ? "Track your weight transformation and photo timeline."
              : "Manage your personal health settings and preferences."}
          </p>
        </div>
        
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {showTracker ? (
            <button
              onClick={() => setShowTracker(false)}
              className="px-5 py-2.5 bg-white border border-border hover:bg-surfaceAlt text-textHeading rounded-full text-xs font-bold transition-all shadow-sm"
            >
              Back to Profile
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-5 py-2.5 bg-white border border-border hover:bg-surfaceAlt text-textHeading rounded-full text-xs font-bold transition-all shadow-sm"
            >
              Edit Profile
            </button>
          )}

          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#EBF2EB] border border-[#D4E6D5] text-[#2C3E2B] font-bold text-sm shadow-sm cursor-pointer hover:bg-[#D4E6D5] transition-colors">
            AR
          </div>
        </div>
      </header>

      {/* Save success / error banners */}
      {saveMessage && (
        <div className="max-w-6xl mx-auto w-full mb-6 p-4 rounded-xl bg-[#EBF2EB] border border-[#D4E6D5] text-[#2C3E2B] text-sm font-medium">
          {saveMessage}
        </div>
      )}
      {errorMessage && (
        <div className="max-w-6xl mx-auto w-full mb-6 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm font-medium">
          {errorMessage}
        </div>
      )}

      {/* Transformation Sub-view */}
      {showTracker ? (
        <div className="max-w-6xl mx-auto w-full">
          <ProgressTracker />
        </div>
      ) : (
        /* Main Profile View matching Profile.png */
        <main className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8">
          
          {/* Left Column: Dietary Preferences & Account Settings */}
          <div className="space-y-8">
            
            {/* Dietary Preferences Card */}
            <section className="bg-white rounded-[24px] border border-border p-6 shadow-sm">
              <h2 className="text-lg font-bold text-textHeading mb-4">Dietary Restrictions &amp; Allergies</h2>
              <p className="text-xs text-textMuted leading-relaxed mb-6">
                Personalize your diet profile. Tapping updates your profile settings instantly.
              </p>

              <div className="mb-6">
                <label className="block text-xs font-semibold text-textMuted mb-2">Dietary Restrictions</label>
                <div className="flex flex-wrap gap-2">
                  {["Vegetarian", "Gluten-Free", "Nut-Free", "Vegan"].map((restriction) => {
                    const selected = dietaryRestrictions.includes(restriction);
                    return (
                      <button
                        key={restriction}
                        type="button"
                        onClick={async () => {
                          const nextRest = selected
                            ? dietaryRestrictions.filter((r) => r !== restriction)
                            : [...dietaryRestrictions, restriction];
                          setValue("dietaryRestrictions", nextRest);
                          
                          // Autosave
                          try {
                            const current = getValues();
                            await saveProfileRequest({
                              ...current,
                              dietaryRestrictions: nextRest,
                            });
                            setSaveMessage("Dietary preferences updated.");
                            setTimeout(() => setSaveMessage(""), 2000);
                          } catch (err) {
                            setErrorMessage("Failed to save changes.");
                          }
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                          selected
                            ? "bg-[#9DB89F] border-[#9DB89F] text-white shadow-sm"
                            : "bg-white border-border text-textHeading hover:border-borderStrong"
                        }`}
                      >
                        {restriction}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-semibold text-textMuted mb-2">Active Food Allergies</label>
                <div className="flex flex-wrap gap-2">
                  {["Shellfish", "Eggs", "Soy", "Fish", "Sesame"].map((allergy) => {
                    const currentAll = watch("foodAllergies") || [];
                    const selected = currentAll.includes(allergy);
                    return (
                      <button
                        key={allergy}
                        type="button"
                        onClick={async () => {
                          const nextAll = selected
                            ? currentAll.filter((a) => a !== allergy)
                            : [...currentAll, allergy];
                          setValue("foodAllergies", nextAll);
                          
                          // Autosave
                          try {
                            const current = getValues();
                            await saveProfileRequest({
                              ...current,
                              foodAllergies: nextAll,
                            });
                            setSaveMessage("Allergies updated.");
                            setTimeout(() => setSaveMessage(""), 2000);
                          } catch (err) {
                            setErrorMessage("Failed to save changes.");
                          }
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                          selected
                            ? "bg-[#E8815A] border-[#E8815A] text-white shadow-sm"
                            : "bg-white border-border text-textHeading hover:border-borderStrong"
                        }`}
                      >
                        {allergy}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="w-full h-px bg-[#F5F5F0] my-6" />

              {/* Nut Allergy Switch */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    const currentRest = watch("dietaryRestrictions") || [];
                    const hasNutFree = currentRest.includes("Nut-Free");
                    const nextRest = hasNutFree
                      ? currentRest.filter(r => r !== "Nut-Free")
                      : [...currentRest, "Nut-Free"];
                    setValue("dietaryRestrictions", nextRest);
                    
                    try {
                      const current = getValues();
                      await saveProfileRequest({
                        ...current,
                        dietaryRestrictions: nextRest,
                      });
                      setSaveMessage("Nut Allergy setting updated.");
                      setTimeout(() => setSaveMessage(""), 2000);
                    } catch (err) {
                      setErrorMessage("Failed to save changes.");
                    }
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                    dietaryRestrictions.includes("Nut-Free") ? "bg-[#9DB89F]" : "bg-border"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      dietaryRestrictions.includes("Nut-Free") ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-xs font-semibold text-textHeading">Nut-Free Allergy Warnings</span>
              </div>
            </section>

            {/* Account Settings List */}
            <section className="space-y-4">
              <h3 className="text-base font-bold text-textHeading uppercase tracking-wider">Account Settings</h3>
              
              <div className="space-y-3">
                {/* 1. Personal Information */}
                <div 
                  onClick={() => setIsEditing(true)}
                  className="bg-white border border-border rounded-2xl p-4 flex justify-between items-center hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF2EB] flex items-center justify-center text-[#7A9E7E]">
                      👤
                    </div>
                    <div>
                      <h4 className="font-bold text-textHeading text-sm">Personal Information</h4>
                      <p className="text-xs text-textMuted mt-0.5">Update your name, age, and weight</p>
                    </div>
                  </div>
                  <span className="text-textMuted text-lg font-bold">&gt;</span>
                </div>

                {/* 2. Progress & Transformation */}
                <div 
                  onClick={() => setShowTracker(true)}
                  className="bg-white border border-border rounded-2xl p-4 flex justify-between items-center hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#FEF0EB] flex items-center justify-center text-[#E8815A]">
                      📈
                    </div>
                    <div>
                      <h4 className="font-bold text-textHeading text-sm">Progress &amp; Transformation</h4>
                      <p className="text-xs text-textMuted mt-0.5">Track your weight and photos timeline</p>
                    </div>
                  </div>
                  <span className="text-textMuted text-lg font-bold">&gt;</span>
                </div>

                {/* 3. Notifications */}
                <div 
                  onClick={() => alert("Notification settings coming soon...")}
                  className="bg-white border border-border rounded-2xl p-4 flex justify-between items-center hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#FEF9EB] flex items-center justify-center text-[#D4A847]">
                      🔔
                    </div>
                    <div>
                      <h4 className="font-bold text-textHeading text-sm">Notifications</h4>
                      <p className="text-xs text-textMuted mt-0.5">Manage your daily meal reminders</p>
                    </div>
                  </div>
                  <span className="text-textMuted text-lg font-bold">&gt;</span>
                </div>

                {/* 4. Privacy & Security */}
                <div 
                  onClick={() => alert("Privacy settings coming soon...")}
                  className="bg-white border border-border rounded-2xl p-4 flex justify-between items-center hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF2F8] flex items-center justify-center text-[#7A9EBE]">
                      🛡️
                    </div>
                    <div>
                      <h4 className="font-bold text-textHeading text-sm">Privacy &amp; Security</h4>
                      <p className="text-xs text-textMuted mt-0.5">Password and data sharing</p>
                    </div>
                  </div>
                  <span className="text-textMuted text-lg font-bold">&gt;</span>
                </div>

                {/* 5. Subscription */}
                <div 
                  onClick={() => alert("Subscription details...")}
                  className="bg-white border border-border rounded-2xl p-4 flex justify-between items-center hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#F5F6F1] flex items-center justify-center text-textHeading">
                      💳
                    </div>
                    <div>
                      <h4 className="font-bold text-textHeading text-sm">Subscription</h4>
                      <p className="text-xs text-textMuted mt-0.5">Nutrixa Pro • Active until Dec 2026</p>
                    </div>
                  </div>
                  <span className="text-textMuted text-lg font-bold">&gt;</span>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Daily Targets */}
          <div className="space-y-8">
            {/* Badges & Achievements Showcase */}
            <BadgesShowcase xp={xp} level={level} unlockedBadges={unlockedBadges} />
            
            {/* Daily Targets Card */}
            <section className="bg-white rounded-[24px] border border-border p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-textHeading text-sm">Daily Targets</h3>
              
              <div className="space-y-4">
                {/* Calories Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline text-xs font-semibold">
                    <span className="text-textHeading">Calories</span>
                    <span className="text-textHeading">{calTarget} kcal</span>
                  </div>
                  <div className="w-full bg-[#F5F5F0] h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#9DB89F] h-full rounded-full" style={{ width: "70%" }} />
                  </div>
                </div>

                {/* Protein Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline text-xs font-semibold">
                    <span className="text-textHeading">Protein</span>
                    <span className="text-textHeading">{proteinGrams}g</span>
                  </div>
                  <div className="w-full bg-[#F5F5F0] h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#9DB89F] h-full rounded-full" style={{ width: "60%" }} />
                  </div>
                </div>

                {/* Carbs Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline text-xs font-semibold">
                    <span className="text-textHeading">Carbs</span>
                    <span className="text-textHeading">{carbsGrams}g</span>
                  </div>
                  <div className="w-full bg-[#F5F5F0] h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#E8815A] h-full rounded-full" style={{ width: "40%" }} />
                  </div>
                </div>
              </div>

              <div className="text-center pt-3 border-t border-[#F5F5F0]">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-bold text-[#7A9E7E] hover:text-[#5C7A60] transition-colors"
                >
                  Adjust Goals
                </button>
              </div>
            </section>



          </div>
        </main>
      )}

      {/* Edit Profile Form Overlay Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-2xl border border-border shadow-2xl relative p-8 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button 
              onClick={() => setIsEditing(false)}
              className="absolute top-6 right-6 text-textMuted hover:text-textHeading text-xl font-bold"
            >
              ✕
            </button>
            
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-textHeading tracking-tight">Edit Profile &amp; Goals</h2>
              <p className="text-textMuted text-xs mt-1">Configure your personal physical dimensions and nutrient targets</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-textMuted mb-1">Full Name</label>
                  <input
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-textHeading focus:outline-none focus:border-[#7A9E7E]"
                    {...register("fullName")}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-textMuted mb-1">Email Address</label>
                  <input
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-textHeading focus:outline-none focus:border-[#7A9E7E]"
                    type="email"
                    {...register("email")}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-textMuted mb-1">Age</label>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-textHeading focus:outline-none focus:border-[#7A9E7E]"
                    {...register("age", { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-textMuted mb-1">Gender</label>
                  <select
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-textHeading focus:outline-none focus:border-[#7A9E7E]"
                    {...register("gender")}
                  >
                    {genderOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-textMuted mb-1">Height (cm)</label>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-textHeading focus:outline-none focus:border-[#7A9E7E]"
                    {...register("height", { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-textMuted mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-textHeading focus:outline-none focus:border-[#7A9E7E]"
                    {...register("weight", { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-textMuted mb-1">Activity Level</label>
                  <select
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-textHeading focus:outline-none focus:border-[#7A9E7E]"
                    {...register("activityLevel")}
                  >
                    {activityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-textMuted mb-1">Diet Strategy</label>
                  <select
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-textHeading focus:outline-none focus:border-[#7A9E7E]"
                    {...register("dietMode")}
                  >
                    {dietModeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-textMuted mb-1">Primary Health Goal</label>
                  <select
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-textHeading focus:outline-none focus:border-[#7A9E7E]"
                    {...register("primaryGoal")}
                  >
                    {primaryGoalOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

              {/* Food Allergies & Dietary Restrictions */}
              <div className="pt-4 border-t border-[#F5F5F0]">
                <h4 className="font-bold text-textHeading text-sm mb-3">Dietary Restrictions &amp; Allergies</h4>
                
                {/* Dietary Restrictions checkboxes/buttons */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-textMuted mb-2">Dietary Restrictions</label>
                  <div className="flex flex-wrap gap-2">
                    {["Vegetarian", "Gluten-Free", "Nut-Free", "Vegan"].map((restriction) => {
                      const currentRest = watch("dietaryRestrictions") || [];
                      const selected = currentRest.includes(restriction);
                      return (
                        <button
                          key={restriction}
                          type="button"
                          onClick={() => {
                            const nextRest = selected
                              ? currentRest.filter((r) => r !== restriction)
                              : [...currentRest, restriction];
                            setValue("dietaryRestrictions", nextRest, { shouldDirty: true });
                          }}
                          className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                            selected
                              ? "bg-[#9DB89F] border-[#9DB89F] text-white shadow-sm"
                              : "bg-white border-border text-textHeading hover:border-borderStrong"
                          }`}
                        >
                          {restriction}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Food Allergies checkboxes/buttons */}
                <div>
                  <label className="block text-xs font-semibold text-textMuted mb-2">Food Allergies</label>
                  <div className="flex flex-wrap gap-2">
                    {["Shellfish", "Eggs", "Soy", "Fish", "Sesame"].map((allergy) => {
                      const currentAll = watch("foodAllergies") || [];
                      const selected = currentAll.includes(allergy);
                      return (
                        <button
                          key={allergy}
                          type="button"
                          onClick={() => {
                            const nextAll = selected
                              ? currentAll.filter((a) => a !== allergy)
                              : [...currentAll, allergy];
                            setValue("foodAllergies", nextAll, { shouldDirty: true });
                          }}
                          className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                            selected
                              ? "bg-[#E8815A] border-[#E8815A] text-white shadow-sm"
                              : "bg-white border-border text-textHeading hover:border-borderStrong"
                          }`}
                        >
                          {allergy}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Targets */}
              <div className="pt-4 border-t border-[#F5F5F0]">
                <h4 className="font-bold text-textHeading text-sm mb-4">Nutritional Targets</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-textMuted mb-1">Calorie Target</label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-textHeading focus:outline-none focus:border-[#7A9E7E]"
                      {...register("nutritionalTargets.calories", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-textMuted mb-1">Water Target (L)</label>
                    <input
                      type="number" step="0.1"
                      className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-textHeading focus:outline-none focus:border-[#7A9E7E]"
                      {...register("nutritionalTargets.water", { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-textMuted mb-1">Protein (%)</label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-textHeading focus:outline-none focus:border-[#7A9E7E]"
                      {...register("nutritionalTargets.protein", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-textMuted mb-1">Carbs (%)</label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-textHeading focus:outline-none focus:border-[#7A9E7E]"
                      {...register("nutritionalTargets.carbs", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-textMuted mb-1">Fat (%)</label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-textHeading focus:outline-none focus:border-[#7A9E7E]"
                      {...register("nutritionalTargets.fat", { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-[#F5F5F0]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 border border-border hover:bg-surfaceAlt text-textHeading text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#9DB89F] hover:bg-[#7A9E7E] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  {isSubmitting ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
