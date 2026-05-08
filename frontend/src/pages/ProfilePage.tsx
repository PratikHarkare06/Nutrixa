import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  BreadcrumbChevronIcon,
  CheckIcon,
  ChevronDownIcon,
  FireIcon,
  ForkKnifeIcon,
  HomeIcon,
  TargetIcon,
  UserIcon,
} from "../components/icons";
import {
  fetchProfileRequest,
  getProfileErrorMessage,
  getSaveProfileErrorMessage,
  saveProfileRequest,
} from "../services/profileApi";
import type { UserProfile } from "../types";

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

const dietaryOptions = [
  { label: "Vegetarian", description: "No meat, poultry, or fish" },
  { label: "Vegan", description: "No animal products" },
  { label: "Gluten-Free", description: "No wheat, barley, or rye" },
  { label: "Dairy-Free", description: "No milk or dairy products" },
  { label: "Nut-Free", description: "No tree nuts or peanuts" },
  { label: "Ketogenic", description: "High fat, very low carb" },
  { label: "Paleo", description: "Whole foods, no processed items" },
  { label: "Low Sodium", description: "Reduced salt intake" },
];

const allergyOptions = ["Shellfish", "Eggs", "Soy", "Fish", "Sesame", "Sulfites"];

const healthConditionsOptions = [
  { label: "Diabetes", description: "Type 1 or Type 2 diabetes" },
  { label: "High Blood Pressure", description: "Hypertension management" },
  { label: "High Cholesterol", description: "Cholesterol management" },
  { label: "Heart Disease", description: "Cardiovascular conditions" },
  { label: "Kidney Disease", description: "Renal health concerns" },
  { label: "Thyroid Disorders", description: "Hypo/hyperthyroidism" },
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
  dietaryRestrictions: ["Vegetarian", "Gluten-Free"],
  email: "sarah.johnson@email.com",
  foodAllergies: ["Shellfish"],
  fullName: "Sarah Johnson",
  gender: "Female",
  height: 165,
  weight: 62,
  healthGoals: [],
  primaryGoal: "Weight Maintenance",
  nutritionalTargets: {
    calories: 1800,
    water: 2.5,
    protein: 25,
    carbs: 45,
    fat: 30,
    fiber: 25,
    sodium: 2000,
  },
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
  weight: profile.weight || 62,
  healthGoals: profile.healthGoals || [],
  primaryGoal: profile.primaryGoal || "Weight Maintenance",
  nutritionalTargets: profile.nutritionalTargets || defaultValues.nutritionalTargets,
});

export const ProfilePage = ({ onNavigate }: ProfilePageProps) => {
  const {
    control,
    formState: { errors, isSubmitting, isDirty },
    getValues,
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    watch,
  } = useForm<ProfileFormValues>({
    defaultValues,
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetchProfileRequest(controller.signal);
        reset(mapProfileToFormValues(response.data));
        setProfile(response.data);
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

  const dietaryRestrictions = watch("dietaryRestrictions");
  const foodAllergies = watch("foodAllergies");
  const healthGoals = watch("healthGoals") || [];
  
  const protein = watch("nutritionalTargets.protein") || 0;
  const carbs = watch("nutritionalTargets.carbs") || 0;
  const fat = watch("nutritionalTargets.fat") || 0;
  const totalMacroPercent = protein + carbs + fat;

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
      setProfile(response.data);
      setSaveMessage("Profile saved successfully.");
    } catch (error) {
      setErrorMessage(getSaveProfileErrorMessage(error));
    }
  };

  const toggleArrayField = (field: "dietaryRestrictions" | "foodAllergies" | "healthGoals", value: string) => {
    const current = getValues(field) || [];
    const nextValues = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    setValue(field, nextValues, { shouldDirty: true });
  };

  const CheckboxLabel = ({ label, description, isChecked, onClick }: any) => (
    <div className="flex items-start gap-3 cursor-pointer" onClick={onClick}>
      <div className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded border transition-colors ${
        isChecked ? "border-primary bg-primary text-white" : "border-gray-500 bg-transparent text-transparent"
      }`}>
        <CheckIcon className="h-3 w-3" />
      </div>
      <div>
        <div className="text-sm font-medium text-textMain leading-none">{label}</div>
        {description && <div className="mt-1 text-xs text-textMuted">{description}</div>}
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-4xl mx-auto pb-24">
          <div className="flex items-center gap-2 text-xs font-medium text-textMuted mb-2">
            <HomeIcon className="h-4 w-4" />
            <button className="hover:text-textMain transition-colors" type="button" onClick={() => onNavigate("/")}>
              Dashboard
            </button>
            <BreadcrumbChevronIcon className="h-3 w-3" />
            <span className="text-textMain">Profile Settings</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-textMain mb-8">
            Profile &amp; Preferences
          </h1>

          {(errorMessage || errors.root?.message || saveMessage) && !isLoading && (
            <div className={`mb-6 rounded-lg border p-4 text-sm font-medium ${
              saveMessage && !errorMessage && !errors.root?.message
                ? "border-success/50 bg-success/10 text-success"
                : "border-danger/50 bg-danger/10 text-danger"
            }`}>
              {errorMessage || errors.root?.message || saveMessage}
            </div>
          )}

          <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Personal Information */}
            {profile && profile.bmi && (
              <section className="rounded-2xl border border-panelBorder bg-panel p-6 mb-6">
                <div className="flex items-start gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-900/30 text-blue-400">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-textMain">Calculated Health Metrics</h2>
                    <p className="text-xs text-textMuted mt-1">Based on your age, height, weight, and activity level</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="rounded-xl border border-panelBorder bg-background p-4 flex flex-col justify-center">
                    <div className="text-xs font-medium text-textMuted mb-1">Body Mass Index (BMI)</div>
                    <div className="flex items-end gap-2">
                      <div className="text-3xl font-bold text-textMain">{profile.bmi}</div>
                      <div className={`text-sm font-medium mb-1 ${
                        profile.bmiCategory === 'Normal weight' ? 'text-success' :
                        profile.bmiCategory === 'Underweight' ? 'text-blue-400' :
                        profile.bmiCategory === 'Overweight' ? 'text-orange-400' : 'text-danger'
                      }`}>
                        {profile.bmiCategory}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-panelBorder bg-background p-4">
                    <div className="text-xs font-medium text-textMuted mb-3">Daily Caloric Targets</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-textMuted">Maintenance:</span>
                        <span className="font-bold text-textMain">{profile.maintenanceCalories} kcal</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-textMuted">Weight Loss:</span>
                        <span className="font-bold text-blue-400">{profile.weightLossCalories} kcal</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-textMuted">Weight Gain:</span>
                        <span className="font-bold text-orange-400">{profile.weightGainCalories} kcal</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-panelBorder bg-panel p-6">
              <div className="flex items-start gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-900/30 text-primary">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-textMain">Personal Information</h2>
                  <p className="text-xs text-textMuted mt-1">Basic details for personalized nutrition analysis</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-textMain mb-2">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    className="w-full rounded-lg border border-panelBorder bg-background px-4 py-2.5 text-sm text-textMain placeholder-textMuted focus:outline-none focus:border-primary"
                    {...register("fullName")}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-textMain mb-2">
                    Email Address <span className="text-danger">*</span>
                  </label>
                  <input
                    className="w-full rounded-lg border border-panelBorder bg-background px-4 py-2.5 text-sm text-textMain placeholder-textMuted focus:outline-none focus:border-primary"
                    {...register("email")}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-textMain mb-2">
                    Age <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-lg border border-panelBorder bg-background px-4 py-2.5 text-sm text-textMain focus:outline-none focus:border-primary"
                      {...register("age", { valueAsNumber: true })}
                    >
                      <option value="" disabled>Select age</option>
                      {Array.from({ length: 83 }, (_, i) => i + 18).map(age => (
                        <option key={age} value={age}>{age} years</option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-textMuted pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-textMain mb-2">
                    Gender <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-lg border border-panelBorder bg-background px-4 py-2.5 text-sm text-textMain focus:outline-none focus:border-primary"
                      {...register("gender")}
                    >
                      {genderOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-textMuted pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-textMain mb-2">
                    Activity Level <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-lg border border-panelBorder bg-background px-4 py-2.5 text-sm text-textMain focus:outline-none focus:border-primary"
                      {...register("activityLevel")}
                    >
                      {activityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-textMuted pointer-events-none" />
                  </div>
                </div>
                <div className="hidden"></div>

                <div>
                  <label className="block text-xs font-medium text-textMain mb-2">
                    Height (cm) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-panelBorder bg-background px-4 py-2.5 text-sm text-textMain placeholder-textMuted focus:outline-none focus:border-primary"
                    {...register("height", { valueAsNumber: true })}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-textMain mb-2">
                    Weight (kg) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-panelBorder bg-background px-4 py-2.5 text-sm text-textMain placeholder-textMuted focus:outline-none focus:border-primary"
                    {...register("weight", { valueAsNumber: true })}
                  />
                </div>
              </div>
            </section>

            {/* Dietary Preferences */}
            <section className="rounded-2xl border border-panelBorder bg-panel p-6">
              <div className="flex items-start gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-900/30 text-purple-400">
                  <ForkKnifeIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-textMain">Dietary Preferences</h2>
                  <p className="text-xs text-textMuted mt-1">Customize your nutrition analysis based on your dietary needs</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-textMain mb-4">Dietary Restrictions</h3>
                <div className="grid grid-cols-2 gap-4">
                  {dietaryOptions.map(opt => (
                    <CheckboxLabel 
                      key={opt.label}
                      label={opt.label}
                      description={opt.description}
                      isChecked={dietaryRestrictions.includes(opt.label)}
                      onClick={() => toggleArrayField("dietaryRestrictions", opt.label)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-textMain mb-4">Food Allergies</h3>
                <div className="grid grid-cols-3 gap-4">
                  {allergyOptions.map(opt => (
                    <CheckboxLabel 
                      key={opt}
                      label={opt}
                      isChecked={foodAllergies.includes(opt)}
                      onClick={() => toggleArrayField("foodAllergies", opt)}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* Health Goals */}
            <section className="rounded-2xl border border-panelBorder bg-panel p-6">
              <div className="flex items-start gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-900/30 text-success">
                  <TargetIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-textMain">Health Goals</h2>
                  <p className="text-xs text-textMuted mt-1">Define your health objectives for personalized recommendations</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-medium text-textMain mb-2">
                  Primary Health Goal <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-lg border border-panelBorder bg-background px-4 py-2.5 text-sm text-textMain focus:outline-none focus:border-primary"
                    {...register("primaryGoal")}
                  >
                    {primaryGoalOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-textMuted pointer-events-none" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-textMain mb-4">Health Conditions</h3>
                <p className="text-xs text-textMuted mb-4 -mt-2">Select any health conditions that may affect your dietary needs</p>
                <div className="grid grid-cols-2 gap-4">
                  {healthConditionsOptions.map(opt => (
                    <CheckboxLabel 
                      key={opt.label}
                      label={opt.label}
                      description={opt.description}
                      isChecked={healthGoals.includes(opt.label)}
                      onClick={() => toggleArrayField("healthGoals", opt.label)}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* Nutritional Targets */}
            <section className="rounded-2xl border border-panelBorder bg-panel p-6">
              <div className="flex items-start gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-900/30 text-primary">
                  <FireIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-textMain">Nutritional Targets</h2>
                  <p className="text-xs text-textMuted mt-1">Set your daily calorie and macronutrient goals</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-medium text-textMain mb-2">
                    Daily Calorie Target <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-panelBorder bg-background px-4 py-2.5 text-sm text-textMain focus:outline-none focus:border-primary mb-1"
                    {...register("nutritionalTargets.calories", { valueAsNumber: true })}
                  />
                  <div className="text-[10px] text-textMuted">Recommended daily calorie intake</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-textMain mb-2">
                    Daily Water Target (L) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number" step="0.1"
                    className="w-full rounded-lg border border-panelBorder bg-background px-4 py-2.5 text-sm text-textMain focus:outline-none focus:border-primary mb-1"
                    {...register("nutritionalTargets.water", { valueAsNumber: true })}
                  />
                  <div className="text-[10px] text-textMuted">Daily water intake goal</div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-textMain mb-4">Macronutrient Distribution</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-textMain mb-2">Protein (%)</label>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-panelBorder bg-background px-4 py-2.5 text-sm text-textMain focus:outline-none focus:border-primary mb-1"
                      {...register("nutritionalTargets.protein", { valueAsNumber: true })}
                    />
                    <div className="text-[10px] text-textMuted">≈ {Math.round((watch("nutritionalTargets.calories") * (protein/100)) / 4)}g daily</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-textMain mb-2">Carbohydrates (%)</label>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-panelBorder bg-background px-4 py-2.5 text-sm text-textMain focus:outline-none focus:border-primary mb-1"
                      {...register("nutritionalTargets.carbs", { valueAsNumber: true })}
                    />
                    <div className="text-[10px] text-textMuted">≈ {Math.round((watch("nutritionalTargets.calories") * (carbs/100)) / 4)}g daily</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-textMain mb-2">Fat (%)</label>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-panelBorder bg-background px-4 py-2.5 text-sm text-textMain focus:outline-none focus:border-primary mb-1"
                      {...register("nutritionalTargets.fat", { valueAsNumber: true })}
                    />
                    <div className="text-[10px] text-textMuted">≈ {Math.round((watch("nutritionalTargets.calories") * (fat/100)) / 9)}g daily</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs text-textMuted">Total Percentage:</span>
                  <span className={`text-sm font-bold ${totalMacroPercent === 100 ? 'text-success' : 'text-danger'}`}>
                    {totalMacroPercent}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-panelBorder">
                <div>
                  <label className="block text-xs font-medium text-textMain mb-2">Daily Fiber Target (g)</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-panelBorder bg-background px-4 py-2.5 text-sm text-textMain focus:outline-none focus:border-primary mb-1"
                    {...register("nutritionalTargets.fiber", { valueAsNumber: true })}
                  />
                  <div className="text-[10px] text-textMuted">Recommended daily fiber intake</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-textMain mb-2">Daily Sodium Limit (mg)</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-panelBorder bg-background px-4 py-2.5 text-sm text-textMain focus:outline-none focus:border-primary mb-1"
                    {...register("nutritionalTargets.sodium", { valueAsNumber: true })}
                  />
                  <div className="text-[10px] text-textMuted">Maximum daily sodium intake</div>
                </div>
              </div>
            </section>
          </form>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-panelBorder bg-background px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-sm text-textMuted">
            {isDirty ? "Unsaved changes" : "No changes to save"}
          </div>
          <button
            form="profile-form"
            type="submit"
            disabled={isLoading || isSubmitting || !isDirty}
            className="px-6 py-2 rounded-lg bg-panel border border-panelBorder text-sm font-medium text-textMain disabled:opacity-50 hover:bg-panelBorder transition-colors flex items-center gap-2"
          >
            {isLoading ? "Loading..." : isSubmitting ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
};
