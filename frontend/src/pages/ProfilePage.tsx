import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { CheckIcon, ChevronDownIcon, ForkKnifeIcon, UserIcon } from "../components/icons";
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

type PreferenceCardProps = {
  description: string;
  isSelected: boolean;
  onClick: () => void;
  title: string;
};

const genderOptions = ["Female", "Male", "Non-Binary", "Prefer Not to Say"];
const activityOptions = [
  "Sedentary",
  "Lightly Active",
  "Moderately Active",
  "Very Active",
];
const dietaryOptions = [
  { description: "No meat, poultry, or fish", label: "Vegetarian" },
  { description: "No wheat, barley, or rye", label: "Gluten-Free" },
  { description: "No tree nuts or peanuts", label: "Nut-Free" },
  { description: "No animal products", label: "Vegan" },
];
const allergyOptions = ["Shellfish", "Eggs", "Soy", "Fish", "Sesame"];

const defaultValues: ProfileFormValues = {
  activityLevel: "Moderately Active",
  age: null,
  dietaryRestrictions: ["Vegetarian", "Gluten-Free"],
  email: "sarah.johnson@email.com",
  foodAllergies: ["Shellfish"],
  fullName: "Sarah Johnson",
  gender: "Female",
  height: 165,
  weight: 62,
};

const PersonalInfoField = ({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) => (
  <label className="block">
    <div className="text-[31px] font-[400] tracking-[-0.03em] text-[#f4f6fb]">
      {label} <span className="text-[#ff6f76]">*</span>
    </div>
    <div className="mt-[18px]">{children}</div>
  </label>
);

const PreferenceCard = ({
  description,
  isSelected,
  onClick,
  title,
}: PreferenceCardProps) => (
  <button
    className="flex min-h-[402px] w-full items-start gap-[34px] rounded-[30px] border border-[#22314f] bg-[#0a0f16] px-[55px] py-[51px] text-left"
    type="button"
    onClick={onClick}
  >
    <div
      className={`mt-[5px] flex h-[36px] w-[36px] items-center justify-center rounded-[5px] border ${
        isSelected
          ? "border-[#ff7a12] bg-[#ff7a12] text-[#1a202c]"
          : "border-[#d0cad8] bg-transparent text-transparent"
      }`}
    >
      <CheckIcon className="h-[24px] w-[24px]" />
    </div>
    <div>
      <div className="text-[31px] font-[700] leading-[1.05] tracking-[-0.03em] text-[#f4f6fb]">
        {title}
      </div>
      <div className="mt-[18px] text-[24px] font-[600] leading-[1.35] tracking-[-0.03em] text-[#97a6c1]">
        {description}
      </div>
    </div>
  </button>
);

const mapProfileToFormValues = (profile: UserProfile): ProfileFormValues => ({
  activityLevel: profile.activityLevel,
  age: profile.age,
  dietaryRestrictions: profile.dietaryRestrictions,
  email: profile.email,
  foodAllergies: profile.foodAllergies,
  fullName: profile.fullName,
  gender: profile.gender,
  height: profile.height,
  weight: profile.weight,
});

const isPositiveValue = (value: unknown) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0;
};

const getInitials = (fullName: string) =>
  fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "SJ";

export const ProfilePage = ({ onNavigate }: ProfilePageProps) => {
  const {
    control,
    formState: { errors, isSubmitting },
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

  const fullName = watch("fullName");
  const dietaryRestrictions = watch("dietaryRestrictions");
  const foodAllergies = watch("foodAllergies");
  const initials = useMemo(() => getInitials(fullName), [fullName]);

  const onSubmit = async (values: ProfileFormValues) => {
    setErrorMessage("");
    setSaveMessage("");

    const missingRequiredField =
      !values.fullName.trim() ||
      !values.email.trim() ||
      values.age === null ||
      values.age === undefined ||
      !values.gender ||
      !values.activityLevel ||
      !values.height ||
      !values.weight;

    if (missingRequiredField) {
      setError("root", {
        message: "Please fill all required fields.",
        type: "manual",
      });
      return;
    }

    const invalidValue =
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) ||
      !isPositiveValue(values.age) ||
      !isPositiveValue(values.height) ||
      !isPositiveValue(values.weight);

    if (invalidValue) {
      setError("root", {
        message: "Invalid value entered.",
        type: "manual",
      });
      return;
    }

    try {
      const response = await saveProfileRequest({
        ...values,
        email: values.email.trim(),
        fullName: values.fullName.trim(),
      });

      reset(mapProfileToFormValues(response.data));
      setSaveMessage("Profile saved.");
    } catch (error) {
      setErrorMessage(getSaveProfileErrorMessage(error));
    }
  };

  const toggleDietaryRestriction = (value: string) => {
    const current = getValues("dietaryRestrictions");
    const nextValues = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];

    setValue("dietaryRestrictions", nextValues, { shouldDirty: true });
  };

  const toggleAllergy = (value: string) => {
    const current = getValues("foodAllergies");
    const nextValues = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];

    setValue("foodAllergies", nextValues, { shouldDirty: true });
  };

  const rootErrorMessage = errors.root?.message;

  return (
    <main className="mx-auto max-w-[880px] px-[48px] pb-[80px] pt-[58px]">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[67px] font-[700] leading-none tracking-[-0.06em] text-[#ff7a12]">
            NutriVision
          </div>
          <div className="mt-[21px] text-[44px] font-[600] leading-none tracking-[-0.05em] text-[#b5c0d4]">
            Profile Settings
          </div>
        </div>
        <button
          className="flex h-[91px] w-[91px] items-center justify-center rounded-full bg-[#ff7a12] text-[31px] font-[500] tracking-[-0.03em] text-white"
          type="button"
          onClick={() => onNavigate("/results")}
        >
          {initials}
        </button>
      </div>

      {(errorMessage || rootErrorMessage || saveMessage) && !isLoading ? (
        <section
          className={`mt-[28px] rounded-[24px] border px-[28px] py-[20px] text-[22px] font-[600] tracking-[-0.02em] ${
            saveMessage && !errorMessage && !rootErrorMessage
              ? "border-[#295842] bg-[#10261b] text-[#8ae1b6]"
              : "border-[#5b2430] bg-[#311821] text-[#ffb4c2]"
          }`}
        >
          {errorMessage || rootErrorMessage || saveMessage}
        </section>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)}>
        <section className="mt-[49px] rounded-[31px] border border-[#22314f] bg-[#1a202c] px-[49px] pb-[61px] pt-[48px]">
          <div className="flex items-start gap-[33px]">
            <div className="flex h-[80px] w-[80px] items-center justify-center rounded-[22px] bg-[#342920] text-[#ff7a12]">
              <UserIcon className="h-[38px] w-[38px]" />
            </div>
            <div>
              <h1 className="text-[42px] font-[700] leading-none tracking-[-0.05em] text-[#f4f6fb]">
                Personal Information
              </h1>
              <p className="mt-[14px] text-[24px] font-[600] leading-[1.25] tracking-[-0.03em] text-[#97a6c1]">
                Basic details for personalized nutrition analysis
              </p>
            </div>
          </div>

          <div className="mt-[59px]">
            <PersonalInfoField label="Full Name">
              <input
                className="h-[85px] w-full rounded-[18px] border border-[#9a9aa0] bg-[#1a202c] px-[33px] text-[31px] font-[400] tracking-[-0.03em] text-[#f4f6fb] placeholder:text-[#5e6d86] focus:outline-none"
                {...register("fullName")}
              />
            </PersonalInfoField>

            <div className="mt-[42px]">
              <PersonalInfoField label="Email Address">
                <input
                  className="h-[85px] w-full rounded-[18px] border border-[#9a9aa0] bg-[#1a202c] px-[33px] text-[31px] font-[400] tracking-[-0.03em] text-[#f4f6fb] placeholder:text-[#5e6d86] focus:outline-none"
                  {...register("email")}
                />
              </PersonalInfoField>
            </div>

            <div className="mt-[42px] grid grid-cols-2 gap-[33px]">
              <PersonalInfoField label="Age">
                <div className="relative">
                  <Controller
                    control={control}
                    name="age"
                    render={({ field }) => (
                      <select
                        className="h-[93px] w-full appearance-none rounded-[22px] border border-[#1f3557] bg-[#0a0f16] px-[33px] text-[31px] font-[400] tracking-[-0.03em] text-[#f4f6fb] focus:outline-none"
                        value={field.value ?? ""}
                        onChange={(event) =>
                          field.onChange(event.target.value ? Number(event.target.value) : null)
                        }
                      >
                        <option value="" />
                        {Array.from({ length: 83 }, (_, index) => index + 18).map((ageValue) => (
                          <option key={ageValue} value={ageValue}>
                            {ageValue}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <ChevronDownIcon className="pointer-events-none absolute right-[26px] top-[35px] h-[28px] w-[28px] text-[#9aacbf]" />
                </div>
              </PersonalInfoField>

              <PersonalInfoField label="Gender">
                <div className="relative">
                  <Controller
                    control={control}
                    name="gender"
                    render={({ field }) => (
                      <select
                        className="h-[93px] w-full appearance-none rounded-[22px] border border-[#1f3557] bg-[#0a0f16] px-[33px] text-[31px] font-[400] tracking-[-0.03em] text-[#f4f6fb] focus:outline-none"
                        {...field}
                      >
                        {genderOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <ChevronDownIcon className="pointer-events-none absolute right-[26px] top-[35px] h-[28px] w-[28px] text-[#9aacbf]" />
                </div>
              </PersonalInfoField>
            </div>

            <div className="mt-[42px]">
              <PersonalInfoField label="Activity Level">
                <div className="relative">
                  <Controller
                    control={control}
                    name="activityLevel"
                    render={({ field }) => (
                      <select
                        className="h-[93px] w-full appearance-none rounded-[22px] border border-[#1f3557] bg-[#0a0f16] px-[33px] text-[31px] font-[400] tracking-[-0.03em] text-[#f4f6fb] focus:outline-none"
                        {...field}
                      >
                        {activityOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <ChevronDownIcon className="pointer-events-none absolute right-[26px] top-[35px] h-[28px] w-[28px] text-[#9aacbf]" />
                </div>
              </PersonalInfoField>
            </div>

            <div className="mt-[42px] grid grid-cols-2 gap-[33px]">
              <PersonalInfoField label="Height (cm)">
                <input
                  className="h-[85px] w-full rounded-[18px] border border-[#9a9aa0] bg-[#1a202c] px-[33px] text-[31px] font-[400] tracking-[-0.03em] text-[#f4f6fb] placeholder:text-[#5e6d86] focus:outline-none"
                  inputMode="numeric"
                  {...register("height", {
                    setValueAs: (value) => (value === "" ? "" : Number(value)),
                  })}
                />
              </PersonalInfoField>

              <PersonalInfoField label="Weight (kg)">
                <input
                  className="h-[85px] w-full rounded-[18px] border border-[#9a9aa0] bg-[#1a202c] px-[33px] text-[31px] font-[400] tracking-[-0.03em] text-[#f4f6fb] placeholder:text-[#5e6d86] focus:outline-none"
                  inputMode="numeric"
                  {...register("weight", {
                    setValueAs: (value) => (value === "" ? "" : Number(value)),
                  })}
                />
              </PersonalInfoField>
            </div>
          </div>
        </section>

        <section className="mt-[50px] rounded-[31px] border border-[#22314f] bg-[#1a202c] px-[49px] pb-[54px] pt-[48px]">
          <div className="flex items-start gap-[33px]">
            <div className="flex h-[80px] w-[80px] items-center justify-center rounded-[22px] bg-[#342920] text-[#ff7a12]">
              <ForkKnifeIcon className="h-[40px] w-[40px]" />
            </div>
            <div>
              <h2 className="text-[42px] font-[700] leading-none tracking-[-0.05em] text-[#f4f6fb]">
                Dietary Preferences
              </h2>
              <p className="mt-[14px] text-[24px] font-[600] leading-[1.25] tracking-[-0.03em] text-[#97a6c1]">
                Customize analysis based on your dietary needs
              </p>
            </div>
          </div>

          <div className="mt-[58px] text-[31px] font-[700] tracking-[-0.03em] text-[#f4f6fb]">
            Dietary Restrictions
          </div>

          <div className="mt-[37px] space-y-[36px]">
            {dietaryOptions.map((option) => (
              <PreferenceCard
                key={option.label}
                description={option.description}
                isSelected={dietaryRestrictions.includes(option.label)}
                title={option.label}
                onClick={() => toggleDietaryRestriction(option.label)}
              />
            ))}
          </div>

          <div className="mt-[49px] text-[31px] font-[700] tracking-[-0.03em] text-[#f4f6fb]">
            Food Allergies
          </div>

          <div className="mt-[29px] flex flex-wrap items-center gap-[18px]">
            {allergyOptions.map((option) => {
              const isSelected = foodAllergies.includes(option);

              return (
                <button
                  key={option}
                  className={`flex h-[65px] items-center justify-center gap-[14px] rounded-[17px] border px-[24px] text-[31px] font-[400] tracking-[-0.03em] ${
                    isSelected
                      ? "border-transparent bg-transparent text-[#f4f6fb]"
                      : "border-[#5b576f] bg-transparent text-[#f4f6fb]"
                  }`}
                  type="button"
                  onClick={() => toggleAllergy(option)}
                >
                  {isSelected ? <CheckIcon className="h-[24px] w-[24px]" /> : null}
                  {option}
                </button>
              );
            })}
          </div>
        </section>

        <button
          className="mt-[42px] flex h-[92px] w-full items-center justify-center rounded-[28px] bg-[#ff7a12] text-[31px] font-[700] tracking-[-0.03em] text-white disabled:opacity-70"
          disabled={isLoading || isSubmitting}
          type="submit"
        >
          {isLoading ? "Loading Profile..." : isSubmitting ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </main>
  );
};
