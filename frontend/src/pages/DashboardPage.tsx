import { useEffect, useState, useRef, useMemo } from "react";
import { useAuthStore } from "../store/authStore";
import { UploadCard } from "../components/UploadCard";
import { useUploadStore } from "../store/uploadStore";
import { Area, AreaChart, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { SearchIcon, FireIcon, WaterIcon, CameraIcon, SpinnerIcon, CloseIcon } from "../components/icons";
import { BarcodeScanner } from "../components/BarcodeScanner";
import { fetchHistoryRequest, addWaterRequest, logCustomMealRequest } from "../services/historyApi";
import { fetchDashboardStatsRequest, updateWorkoutIntensityRequest, fetchProfileRequest, fetchProgressLogsRequest, fetchSleepLogsRequest } from "../services/profileApi";
import { fetchWorkoutLogsRequest } from "../services/workoutApi";
import { checkNotificationPermission, requestNotificationPermission } from "../utils/notificationManager";

type DashboardPageProps = {
  onUploadSuccess: () => void;
  onNavigate?: (path: string) => void;
};

// Calorie trend data is calculated dynamically below

const RECIPE_SUGGESTIONS = [
  {
    name: "Mediterranean Quinoa Bowl",
    type: "Lunch",
    calories: 450,
    protein: 16,
    carbs: 55,
    fat: 18,
    prepTime: "15 mins",
    image: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=600&auto=format&fit=crop&q=80",
    tags: ["Vegetarian", "Gluten-Free"],
    ingredients: [
      "1 cup cooked Quinoa",
      "1/2 cup Chickpeas, rinsed",
      "1/2 cup Cucumber, diced",
      "1/2 cup Cherry Tomatoes, halved",
      "2 tbsp Feta Cheese, crumbled",
      "1 tbsp Olive oil & Lemon dressing"
    ],
    instructions: [
      "Place cooked quinoa in a bowl.",
      "Arrange chickpeas, cucumber, tomatoes, and feta cheese on top.",
      "Drizzle with olive oil and lemon dressing.",
      "Toss gently and serve."
    ]
  },
  {
    name: "Tofu Stir-Fry",
    type: "Lunch",
    calories: 390,
    protein: 28,
    carbs: 22,
    fat: 12,
    prepTime: "20 mins",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop&q=80",
    tags: ["High Protein", "Vegetarian"],
    ingredients: [
      "150g firm Tofu, cubed",
      "1 cup Mixed Bell Peppers & Broccoli",
      "1 tbsp Soy Sauce (low sodium)",
      "1 tsp Sesame oil",
      "Garlic and ginger, minced"
    ],
    instructions: [
      "Heat sesame oil in a skillet and sauté garlic & ginger.",
      "Add tofu and stir-fry until golden.",
      "Add vegetables and cook for 5 minutes until tender-crisp.",
      "Stir in soy sauce and serve hot."
    ]
  },
  {
    name: "Paneer Tikka Salad",
    type: "Dinner",
    calories: 380,
    protein: 24,
    carbs: 12,
    fat: 26,
    prepTime: "15 mins",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
    tags: ["Vegetarian", "Gluten-Free", "High Protein"],
    ingredients: [
      "200g Paneer, cubed",
      "1 cup Bell Peppers, chopped",
      "1/2 cup Cucumber, sliced",
      "1 tbsp Mint Chutney",
      "Lemon juice, salt, and chaat masala"
    ],
    instructions: [
      "Toss paneer and bell peppers in salt and spices.",
      "Pan-sear or grill paneer and peppers until lightly charred.",
      "Combine grilled ingredients with fresh cucumber and mint chutney.",
      "Drizzle lemon juice and serve warm."
    ]
  },
  {
    name: "Grilled Chicken & Veggies",
    type: "Dinner",
    calories: 420,
    protein: 40,
    carbs: 15,
    fat: 14,
    prepTime: "25 mins",
    image: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600&auto=format&fit=crop&q=80",
    tags: ["Gluten-Free", "High Protein", "Non-Vegetarian"],
    ingredients: [
      "150g Chicken Breast",
      "1 cup Broccoli florets",
      "1/2 cup Carrots, sliced",
      "1 tbsp Olive oil",
      "Garlic powder, herbs, salt, and pepper"
    ],
    instructions: [
      "Marinate chicken with garlic powder, herbs, salt, and pepper.",
      "Grill chicken breast in a skillet with olive oil (6-8 mins each side).",
      "Steam broccoli and carrots.",
      "Serve hot chicken breast alongside the steamed veggies."
    ]
  },
  {
    name: "Roasted Chickpeas & Almonds",
    type: "Snack",
    calories: 180,
    protein: 8,
    carbs: 18,
    fat: 10,
    prepTime: "10 mins",
    image: "https://images.unsplash.com/photo-1629115913427-e40738f97144?w=600&auto=format&fit=crop&q=80",
    tags: ["Vegetarian", "Vegan", "Gluten-Free"],
    ingredients: [
      "1/2 cup boiled Chickpeas",
      "10-12 Almonds",
      "1 tsp Olive oil",
      "Pinch of turmeric, salt, and chili powder"
    ],
    instructions: [
      "Pat chickpeas dry with a towel.",
      "Toss chickpeas and almonds in olive oil and dry spices.",
      "Pan-roast in a skillet on medium heat until crispy (approx. 8 mins).",
      "Let cool slightly and enjoy."
    ]
  },
  {
    name: "Masala Oats",
    type: "Breakfast",
    calories: 250,
    protein: 9,
    carbs: 42,
    fat: 5,
    prepTime: "10 mins",
    image: "https://images.unsplash.com/photo-1517686469429-8faf88b9f7af?w=600&auto=format&fit=crop&q=80",
    tags: ["Vegetarian", "High Fiber"],
    ingredients: [
      "1/2 cup Rolled Oats",
      "1/4 cup Peas and Carrots, diced",
      "1/2 small Onion, chopped",
      "1/2 tsp Cumin seeds",
      "Water, salt, turmeric, and fresh coriander"
    ],
    instructions: [
      "Sauté cumin seeds, onions, and veggies in a pan with a drop of oil.",
      "Add oats and stir for 1 minute.",
      "Pour in 1.5 cups of water and add spices.",
      "Simmer for 5-6 minutes until oats are soft and thick. Garnish with coriander."
    ]
  },
  {
    name: "Moong Dal Chilla",
    type: "Breakfast",
    calories: 280,
    protein: 14,
    carbs: 44,
    fat: 6,
    prepTime: "20 mins",
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
    tags: ["Vegetarian", "Gluten-Free", "High Protein"],
    ingredients: [
      "1/2 cup Moong Dal (soaked & blended)",
      "2 tbsp grated Paneer (for filling)",
      "1 chopped green chili",
      "Pinch of ginger paste and hing",
      "Salt and fresh coriander"
    ],
    instructions: [
      "Blend soaked dal with ginger and green chili into a smooth batter.",
      "Pour a ladle of batter onto a hot non-stick tawa and spread thin.",
      "Cook on medium heat until golden, flip and cook the other side.",
      "Add grated paneer in the center, fold and serve with mint chutney."
    ]
  },
  {
    name: "Mixed Fruit Parfait",
    type: "Snack",
    calories: 190,
    protein: 10,
    carbs: 28,
    fat: 4,
    prepTime: "5 mins",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80",
    tags: ["Vegetarian", "Gluten-Free"],
    ingredients: [
      "150g Low-fat Curd or Greek Yogurt",
      "1/4 cup Strawberries & Pomegranate",
      "1 tsp Honey",
      "1 tbsp Chia Seeds"
    ],
    instructions: [
      "Whisk yogurt with honey until smooth.",
      "Layer half the yogurt in a cup, top with a layer of mixed fruits and chia seeds.",
      "Add the remaining yogurt and top with pomegranate seeds.",
      "Serve chilled."
    ]
  }
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border rounded-xl p-3 shadow-md">
        <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Calories logged</p>
        <p className="text-sm font-extrabold text-textHeading mt-0.5">{payload[0].value} kcal</p>
      </div>
    );
  }
  return null;
};

export const DashboardPage = ({ onUploadSuccess, onNavigate }: DashboardPageProps) => {
  const { isAuthenticated, user } = useAuthStore();
  const cancelUpload = useUploadStore((state) => state.cancelUpload);
  const clearError = useUploadStore((state) => state.clearError);
  const dragActive = useUploadStore((state) => state.dragActive);
  const errorMessage = useUploadStore((state) => state.errorMessage);
  const isUploading = useUploadStore((state) => state.isUploading);
  const setDragActive = useUploadStore((state) => state.setDragActive);
  const uploadImage = useUploadStore((state) => state.uploadImage);
  const uploadVoiceLog = useUploadStore((state) => state.uploadVoiceLog);
  const uploadVoiceAudio = useUploadStore((state) => state.uploadVoiceAudio);
  const scanBarcode = useUploadStore((state) => state.scanBarcode);
  const progressMessage = useUploadStore((state) => state.progressMessage);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(checkNotificationPermission());

  useEffect(() => {
    setNotifPermission(checkNotificationPermission());
  }, []);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadDishName, setUploadDishName] = useState("");
  const [hydrationML, setHydrationML] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: "streak", emoji: "⭐", bg: "#EBF2EB", border: "#D4E6D5", titleColor: "#2C3E2B", textColor: "#2C3E2B", title: "0 Day Streak!", text: "You have maintained a 0-day food logging consistency." },
    { id: 2, type: "water", emoji: "💧", bg: "#FEF0EB", border: "#FEE2D5", titleColor: "#E8815A", textColor: "#E8815A", title: "Hydration Target", text: "Don't forget to log 500ml water after your lunch." },
    { id: 3, type: "workout", emoji: "🏋️‍♂️", bg: "#EBF2F8", border: "#E2E4DC", titleColor: "#2C3E2B", textColor: "#888888", title: "Workout Logged", text: "3 workout sessions synchronized from Apple Health." }
  ]);

  // Daily AI Macro Advisor state
  const [todayMacros, setTodayMacros] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [macroAdvice, setMacroAdvice] = useState("");

  // Dynamic Hydration Coach state
  const [workoutIntensity, setWorkoutIntensity] = useState<"rest" | "light" | "moderate" | "intense">("moderate");
  const [hydrationStreak, setHydrationStreak] = useState(0);
  const [weeklyHydration, setWeeklyHydration] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [mealStreak, setMealStreak] = useState(0);
  const [mealLogsWeek, setMealLogsWeek] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [consistencyScore, setConsistencyScore] = useState(0);

  const [profile, setProfile] = useState<any>(null);
  const [sleepLogs, setSleepLogs] = useState<any[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [progressLogs, setProgressLogs] = useState<any[]>([]);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [todayMeals, setTodayMeals] = useState<any[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [isLoggingRecipe, setIsLoggingRecipe] = useState(false);

  // Dynamic Goals based on Profile
  const GOALS = useMemo(() => {
    const defaultGoals = { calories: 1900, protein: 120, carbs: 200, fat: 60 };
    if (!profile) return defaultGoals;
    const calories = profile.maintenanceCalories || defaultGoals.calories;
    const protein = Math.round((calories * 0.25) / 4);
    const carbs = Math.round((calories * 0.45) / 4);
    const fat = Math.round((calories * 0.30) / 9);
    return { calories, protein, carbs, fat };
  }, [profile]);

  // Dynamic Meal Suggestions based on remaining calories & profile diet preferences
  const mealSuggestions = useMemo(() => {
    const isVegetarian = profile?.dietaryRestrictions?.includes("Vegetarian") || profile?.dietary_restrictions?.includes("Vegetarian");

    const availableSuggestions = RECIPE_SUGGESTIONS.filter(recipe => {
      if (isVegetarian && recipe.tags.includes("Non-Vegetarian")) return false;
      return true;
    });

    // Rotate suggestions dynamically every day of the month so they change daily
    const dayOfMonth = new Date().getDate();
    const categories = ["Breakfast", "Lunch", "Dinner", "Snack"];
    const selectedSuggestions: any[] = [];

    categories.forEach(cat => {
      const matching = availableSuggestions.filter(r => r.type.toLowerCase() === cat.toLowerCase());
      if (matching.length > 0) {
        const recipeIndex = dayOfMonth % matching.length;
        selectedSuggestions.push(matching[recipeIndex]);
      }
    });

    return selectedSuggestions;
  }, [profile]);

  const HYDRATION_GOALS: Record<string, number> = {
    rest: 2000,
    light: 2500,
    moderate: 3000,
    intense: 3500,
  };
  const waterGoal = HYDRATION_GOALS[workoutIntensity] || 2500;

  // Dynamically calculated Calorie Trend Data for past 7 days
  const calorieTrendData = useMemo(() => {
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    }).reverse();

    const map: Record<string, number> = {};
    historyLogs.forEach(item => {
      if (!item.createdAt || !item.macros?.calories) return;
      const dateStr = new Date(item.createdAt).toISOString().split("T")[0];
      map[dateStr] = (map[dateStr] || 0) + item.macros.calories;
    });

    return dates.map(dateStr => {
      const calories = map[dateStr] || 0;
      const dayLetter = new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" }).substring(0, 1);
      return {
        day: dayLetter,
        calories,
      };
    });
  }, [historyLogs]);

  const loadDashboardStats = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetchDashboardStatsRequest();
      let dStreak = 0;
      if (res.success) {
        const d = res.data;
        dStreak = d.mealStreak;
        setHydrationML(d.hydrationML);
        setWorkoutIntensity(d.workoutIntensity);
        setHydrationStreak(d.hydrationStreak);
        setWeeklyHydration(d.weeklyHydration || [0,0,0,0,0,0,0]);
        setMealStreak(d.mealStreak);
        setMealLogsWeek(d.mealLogsWeek || [false,false,false,false,false,false,false]);
        setConsistencyScore(d.consistencyScore);
      }

      // Load Profile
      const profRes = await fetchProfileRequest();
      let uName = "User";
      if (profRes.success) {
        setProfile(profRes.data);
        uName = profRes.data.fullName || "User";
      }

      setNotifications(prev => prev.map(n => {
        if (n.type === "streak") {
          return {
            ...n,
            title: `${dStreak} Day Streak!`,
            text: `${uName}, you have maintained a ${dStreak}-day food logging consistency.`
          };
        }
        return n;
      }));

      // Fetch history for macros, calorie trends, and logged meals
      const histRes = await fetchHistoryRequest({ limit: 20, page: 1, sort: "desc" });
      if (histRes.success) {
        setHistoryLogs(histRes.data || []);
        const today = new Date().toDateString();
        const todayEntries = (histRes.data || []).filter((e: any) => new Date(e.createdAt).toDateString() === today);
        setTodayMeals(todayEntries);
        
        const totals = todayEntries.reduce(
          (acc: any, e: any) => ({
            calories: acc.calories + (e.macros?.calories || 0),
            protein: acc.protein + (e.macros?.protein || 0),
            carbs: acc.carbs + (e.macros?.carbs || 0),
            fat: acc.fat + (e.macros?.fat || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
        setTodayMacros({
          calories: Math.round(totals.calories),
          protein: Math.round(totals.protein),
          carbs: Math.round(totals.carbs),
          fat: Math.round(totals.fat),
        });
      }

      // Load Sleep Logs
      const sleepRes = await fetchSleepLogsRequest();
      if (sleepRes.success) {
        setSleepLogs(sleepRes.data || []);
      }

      // Load Workout Logs
      const workoutRes = await fetchWorkoutLogsRequest();
      if (workoutRes.success) {
        setWorkoutLogs(workoutRes.data || []);
      }

      // Load Progress Logs
      const progRes = await fetchProgressLogsRequest();
      if (progRes.success) {
        setProgressLogs(progRes.data || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardStats();
    } else {
      // Clear stats for Guest mode
      setHydrationML(0);
      setWorkoutIntensity("moderate");
      setHydrationStreak(0);
      setMealStreak(0);
      setConsistencyScore(0);
      setWeeklyHydration([0,0,0,0,0,0,0]);
      setMealLogsWeek([false,false,false,false,false,false,false]);
    }
  }, [isAuthenticated]);

  const getTimeSegments = (totalMl: number, goal: number) => {
    const now = new Date();
    const hour = now.getHours();
    // Morning: 08-12, Afternoon: 12-17, Evening: 17-21+
    const morningTarget = goal * 0.35;
    const afternoonTarget = goal * 0.40;
    const eveningTarget = goal * 0.25;
    // Distribute consumed water by time-of-day
    const morningConsumed = hour >= 8 ? Math.min(totalMl * 0.35, morningTarget) : 0;
    const afternoonConsumed = hour >= 12 ? Math.min(totalMl * 0.40, afternoonTarget) : 0;
    const eveningConsumed = hour >= 17 ? Math.min(totalMl * 0.25, eveningTarget) : 0;
    return [
      { label: "Morning", icon: "🌅", consumed: Math.round(morningConsumed), target: Math.round(morningTarget), active: hour >= 8 && hour < 12 },
      { label: "Afternoon", icon: "☀️", consumed: Math.round(afternoonConsumed), target: Math.round(afternoonTarget), active: hour >= 12 && hour < 17 },
      { label: "Evening", icon: "🌙", consumed: Math.round(eveningConsumed), target: Math.round(eveningTarget), active: hour >= 17 },
    ];
  };

  const getHydrationTip = (intensity: string, pct: number) => {
    if (intensity === "intense") return "High-intensity session detected! Drink 500ml within 30 min post-workout to replenish electrolytes.";
    if (intensity === "moderate" && pct < 50) return "You're halfway through your day — make sure to drink 250ml before each meal for optimal digestion.";
    if (pct >= 90) return "Excellent hydration today! 💦 You're in the optimal zone for nutrient absorption and metabolism.";
    if (pct < 30) return "Hydration is low! Set a reminder to drink a glass of water every 90 minutes throughout the day.";
    return "Consistent hydration supports energy levels, skin health, and workout performance. Keep sipping!";
  };

  // Voice & Barcode Logging States
  const [loggingMode, setLoggingMode] = useState<"image" | "voice" | "barcode">("image");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState("");

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      cancelUpload();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cancelUpload]);

  // Fetch today's meal logs to build the AI Macro Advisor card
  useEffect(() => {
    const controller = new AbortController();
    const loadTodayMacros = async () => {
      try {
        const res = await fetchHistoryRequest({ limit: 20, page: 1, sort: "desc", signal: controller.signal });
        setHistoryLogs(res.data || []);
        const today = new Date().toDateString();
        const todayEntries = (res.data || []).filter((e: any) => new Date(e.createdAt).toDateString() === today);
        setTodayMeals(todayEntries);
        const totals = todayEntries.reduce(
          (acc: any, e: any) => ({
            calories: acc.calories + (e.macros?.calories || 0),
            protein: acc.protein + (e.macros?.protein || 0),
            carbs: acc.carbs + (e.macros?.carbs || 0),
            fat: acc.fat + (e.macros?.fat || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
        setTodayMacros({
          calories: Math.round(totals.calories),
          protein: Math.round(totals.protein),
          carbs: Math.round(totals.carbs),
          fat: Math.round(totals.fat),
        });

        // Calculate dynamic goals inside callback to avoid stale closures
        const profRes = await fetchProfileRequest(controller.signal);
        const profileData = profRes.success ? profRes.data : null;

        const currentGoals = {
          calories: profileData?.maintenanceCalories || 1900,
          protein: profileData?.maintenanceCalories ? Math.round((profileData.maintenanceCalories * 0.25) / 4) : 120,
          carbs: profileData?.maintenanceCalories ? Math.round((profileData.maintenanceCalories * 0.45) / 4) : 200,
          fat: profileData?.maintenanceCalories ? Math.round((profileData.maintenanceCalories * 0.30) / 9) : 60,
        };

        // Generate adaptive advice
        const pctProt = (totals.protein / currentGoals.protein) * 100;
        const pctCarbs = (totals.carbs / currentGoals.carbs) * 100;
        const pctFat = (totals.fat / currentGoals.fat) * 100;
        const pctCal = (totals.calories / currentGoals.calories) * 100;

        let advice = "";
        if (pctProt < 30 && pctCarbs > 60) {
          advice = "You're heavy on carbs but low on protein today. Try adding a lean protein source like grilled chicken, eggs, or Greek yogurt to your next meal.";
        } else if (pctProt > 90 && pctCarbs < 40) {
          advice = "Great protein intake! Your carbs are still low — consider adding a complex carb like brown rice or oats to fuel your evening workout.";
        } else if (pctFat > 90 && pctCal > 80) {
          advice = "Fat and calorie intake is high today. Opt for lighter, plant-based options like steamed veggies or a fresh salad for your remaining meals.";
        } else if (pctCal < 30 && todayEntries.length === 0) {
          advice = "No meals logged yet today. Start tracking to get personalized macro coaching and keep your nutrition on track!";
        } else if (pctCal < 40) {
          advice = `You've consumed ${Math.round(totals.calories)} kcal out of your ${currentGoals.calories.toLocaleString()} kcal goal. Don't skip meals — your body needs consistent fuel to maintain metabolism.`;
        } else if (pctCal > 95) {
          advice = "You're close to your calorie limit for today. Stick to high-volume, low-calorie options like salad, broth soups, or cucumber for any evening snacks.";
        } else {
          advice = `You're on track with ${Math.round(pctCal)}% of your calorie goal. Your macros look balanced — keep it up! Log your next meal to stay consistent.`;
        }
        setMacroAdvice(advice);
      } catch (_) {
        // Silently fail — card will hide if no data
      }
    };
    void loadTodayMacros();
    return () => controller.abort();
  }, []);

  const startRecording = async () => {
    clearError();
    setSpeechError("");
    setVoiceTranscript("");
    audioChunksRef.current = [];

    // 1. Start Native MediaRecorder
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia is not supported in this browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        // Upload audio for server-side transcription and analysis
        const success = await uploadVoiceAudio(audioBlob);
        if (success) {
          setIsUploadModalOpen(false);
          if (onUploadSuccess) onUploadSuccess();
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.warn("Could not start native audio recording:", err);
      setSpeechError("Could not access microphone. Please verify permissions or type your meal manually.");
      return;
    }

    // 2. Start Web Speech API as live visual transcription overlay if supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";

        rec.onresult = (event: any) => {
          const currentTranscript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join(" ");
          setVoiceTranscript(currentTranscript);
        };

        rec.onerror = (event: any) => {
          // Ignore Web Speech API errors since we are recording natively
          console.warn("Live speech preview error:", event.error);
        };

        recognitionRef.current = rec;
        rec.start();
      } catch (err: any) {
        console.warn("Live speech preview init failed:", err);
      }
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleOpenModal = () => {
    clearError();
    setLoggingMode("image");
    setVoiceTranscript("");
    setSpeechError("");
    setIsUploadModalOpen(true);
  };

  const handleCloseModal = () => {
    clearError();
    cancelUpload();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    setUploadDishName("");
    setIsUploadModalOpen(false);
  };

  // Handle successful scan
  const handleFileSelected = async (file: File | null) => {
    clearError();
    const success = await uploadImage(file, "auto", uploadDishName);
    if (success) {
      setIsUploadModalOpen(false);
      setUploadDishName("");
      onUploadSuccess();
    }
  };

  // Handle voice upload
  const handleVoiceSubmit = async () => {
    if (!voiceTranscript.trim()) return;
    clearError();
    const success = await uploadVoiceLog(voiceTranscript);
    if (success) {
      setIsUploadModalOpen(false);
      onUploadSuccess();
    }
  };

  // Handle barcode lookup detection
  const handleBarcodeDetected = async (barcode: string) => {
    if (!barcode.trim()) return;
    clearError();
    const success = await scanBarcode(barcode);
    if (success) {
      setIsUploadModalOpen(false);
      onUploadSuccess();
    }
  };

  const handleAddWater = async (amount: number) => {
    if (!isAuthenticated) {
      alert("Sign in to track water and personalize goals!");
      onNavigate?.("/auth");
      return;
    }
    try {
      const res = await addWaterRequest(amount);
      if (res.success) {
        await loadDashboardStats();
      }
    } catch (err) {
      console.error("Failed to log water", err);
    }
  };

  const handleSubtractWater = async () => {
    if (!isAuthenticated) {
      alert("Sign in to track water and personalize goals!");
      onNavigate?.("/auth");
      return;
    }
    try {
      const res = await addWaterRequest(-250);
      if (res.success) {
        await loadDashboardStats();
      }
    } catch (err) {
      console.error("Failed to log water", err);
    }
  };

  const handleIntensityChange = async (intensity: "rest" | "light" | "moderate" | "intense") => {
    if (!isAuthenticated) {
      alert("Sign in to update workout intensity and personalize goals!");
      onNavigate?.("/auth");
      return;
    }
    setWorkoutIntensity(intensity);
    try {
      const res = await updateWorkoutIntensityRequest(intensity);
      if (res.success) {
        await loadDashboardStats();
      }
    } catch (err) {
    }
  };

  const hydrationPercent = Math.min(100, Math.round((hydrationML / waterGoal) * 100));

  return (
    <div className="flex-1 min-h-screen bg-background relative overflow-y-auto pb-24 animate-fade-in">
      {/* Top Header */}
      <header className="px-4 sm:px-8 pt-8 pb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between max-w-6xl mx-auto w-full">
        <div>
          <h1 className="text-3xl font-bold text-textHeading tracking-tight">
            {isAuthenticated && user ? `Welcome back, ${user.name}` : "Welcome to Nutrixa"}
          </h1>
          <p className="text-textMuted text-sm mt-1">
            {isAuthenticated && user 
              ? "Keep tracking your daily nutrition to reach your goals." 
              : "Try our AI Food Calorie Scanner below to analyze meals instantly!"}
          </p>
        </div>
        <div className="flex items-center gap-3 relative self-start sm:self-auto">
          {/* Header Action Buttons */}
          <button 
            onClick={() => onNavigate?.("/history")}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-border hover:bg-surfaceAlt text-textHeading transition-colors shadow-sm"
          >
            <SearchIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-border hover:bg-surfaceAlt text-textHeading transition-colors shadow-sm relative"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            {notifications.length > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>
          <button 
            type="button"
            onClick={async () => {
              if (notifPermission !== "granted") {
                const granted = await requestNotificationPermission();
                setNotifPermission(granted ? "granted" : "denied");
              } else {
                onNavigate?.("/profile");
              }
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 shadow-sm relative shrink-0 ${
              notifPermission === "granted" 
                ? "bg-[#EBF2EB] border-[#D4E6D5] text-[#7A9E7E] hover:bg-[#D4E6D5]" 
                : "bg-[#FFF9E6] border-[#FFEBB3] text-[#D4A847] hover:bg-[#FFEBB3] animate-pulse"
            }`}
            title={notifPermission === "granted" ? "Web Notifications Active (Click to manage)" : "Enable Web Notifications for reminders"}
          >
            <span className="text-sm">{notifPermission === "granted" ? "🔔" : "🔕"}</span>
            {notifPermission !== "granted" && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-orange-500 text-[8px] font-black text-white">
                !
              </span>
            )}
          </button>
          <div 
            onClick={() => onNavigate?.("/profile")}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#EBF2EB] border border-[#D4E6D5] text-[#2C3E2B] font-bold text-sm shadow-sm cursor-pointer hover:bg-[#D4E6D5] transition-colors"
          >
            {(() => {
              const nameToUse = profile?.fullName || user?.name || "User";
              return nameToUse
                .split(" ")
                .filter(Boolean)
                .map((n: string) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();
            })()}
          </div>
        </div>
      </header>

      {/* Notifications Dropdown — fixed on mobile, absolute on desktop */}
      {showNotifications && (
        <>
          {/* Mobile backdrop to close on tap-outside */}
          <div
            className="fixed inset-0 z-40 sm:hidden"
            onClick={() => setShowNotifications(false)}
          />
          <div className="fixed left-4 right-4 top-[8.5rem] z-50 sm:absolute sm:left-auto sm:right-8 sm:top-auto sm:mt-2 w-auto sm:w-80 bg-white border border-border rounded-2xl shadow-xl p-4 animate-slide-up">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-textHeading text-xs">Notifications</h4>
              <button 
                onClick={() => setShowNotifications(false)}
                className="text-[10px] text-textMuted hover:text-textHeading font-semibold"
              >
                Close
              </button>
            </div>
            <div className="space-y-3">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    style={{ backgroundColor: notif.bg, borderColor: notif.border }}
                    className="p-2.5 rounded-xl border flex gap-2 items-start relative group"
                  >
                    <span className="text-sm">{notif.emoji}</span>
                    <div className="flex-1 min-w-0 pr-4">
                      <h5 className="font-bold text-[10px]" style={{ color: notif.titleColor }}>{notif.title}</h5>
                      <p className="text-[9px] mt-0.5" style={{ color: notif.textColor }}>{notif.text}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
                      }}
                      className="absolute top-2 right-2 text-textMuted hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold px-1"
                      title="Dismiss"
                    >
                      ✕
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-textMuted font-medium">
                  No new notifications
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Main Grid Content */}
      <main className="px-8 py-4 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8">
        
        {/* Left Column (Meals & Hydration) */}
        <div className="space-y-8">
          
          {/* Today's Meals Section */}
          <section className="bg-white rounded-[24px] border border-border p-6 shadow-sm card-hover animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-textHeading">Today's Meals</h2>
              <button 
                onClick={handleOpenModal}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#9DB89F] hover:bg-[#7A9E7E] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <span className="text-sm font-semibold">+</span> Log Meal
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Render AI Suggestions */}
              {mealSuggestions.map((recipe: any) => (
                <div key={recipe.name} className="bg-white border border-dashed border-[#9DB89F]/60 rounded-2xl overflow-hidden card-hover transition-all flex flex-col justify-between relative bg-gradient-to-br from-white to-[#F9FAF8]/40">
                  <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-full bg-[#9DB89F] text-white text-[9px] font-bold uppercase tracking-wider shadow-sm">
                    Suggested {recipe.type}
                  </span>
                  <img 
                    src={recipe.image} 
                    alt={recipe.name} 
                    className="w-full h-40 object-cover opacity-95"
                  />
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-textHeading text-sm line-clamp-1">{recipe.name}</h3>
                      <p className="text-[10px] text-textMuted mt-1 mb-3">Healthy &amp; fits your remaining limit</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-[11px] font-semibold text-[#5C7A60] bg-[#EBF2EB]/50 rounded-xl p-2">
                        <span className="flex items-center gap-1 text-orange-600">
                          🔥 {recipe.calories} kcal
                        </span>
                        <span className="flex items-center gap-0.5">
                          💪 {recipe.protein}g P
                        </span>
                        <span className="text-textMuted text-[10px] ml-auto">⏱️ {recipe.prepTime}</span>
                      </div>
                      <button
                        onClick={() => setSelectedRecipe(recipe)}
                        className="w-full py-2 bg-white hover:bg-[#EBF2EB] border border-[#9DB89F]/40 hover:border-[#9DB89F] text-[#7A9E7E] text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1"
                      >
                        <span>📖</span> View Recipe &amp; Log
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Feature 4: Dynamic Hydration Coach (upgraded) ── */}
          <section className="bg-white rounded-[24px] border border-border p-6 shadow-sm card-hover animate-slide-up relative overflow-hidden">
            <style>{`
              @keyframes waveMove {
                0% { transform: translate(-160px, 0); }
                100% { transform: translate(0, 0); }
              }
              .wave-animate-1 { animation: waveMove 3s infinite linear; }
              .wave-animate-2 { animation: waveMove 2s infinite linear; }
            `}</style>

            {/* Header row */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-textHeading flex items-center gap-2">
                  <WaterIcon className="w-5 h-5 text-[#7A9EBE]" />
                  Dynamic Hydration Coach
                </h2>
                <p className="text-xs text-textMuted mt-0.5">
                  Goal: <span className="font-bold text-[#7A9EBE]">{(waterGoal/1000).toFixed(1)}L</span>
                  &nbsp;·&nbsp;Consumed: <span className="font-bold text-textHeading">{(hydrationML/1000).toFixed(2)}L</span>
                  &nbsp;·&nbsp;<span className="text-amber-500 font-bold">🔥 {hydrationStreak}d streak</span>
                </p>
              </div>
              {hydrationML > 0 && (
                <button
                  onClick={handleSubtractWater}
                  title="Undo last log"
                  className="text-xs font-bold text-[#E8815A] hover:text-[#c4613b] border border-[#FEE2D5] bg-[#FEF0EB] px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 shadow-sm"
                >
                  <span>↺</span> Undo
                </button>
              )}
            </div>

            {/* Workout Intensity Selector */}
            <div className="mb-4">
              <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-2">Today's Workout Intensity</p>
              <div className="flex gap-2">
                {([
                  { key: "rest", label: "Rest", emoji: "😴", color: "#9DB89F" },
                  { key: "light", label: "Light", emoji: "🚶", color: "#D4A847" },
                  { key: "moderate", label: "Moderate", emoji: "🏃", color: "#7A9EBE" },
                  { key: "intense", label: "Intense", emoji: "🔥", color: "#E8815A" },
                ] as const).map(({ key, label, emoji, color }) => (
                  <button
                    key={key}
                    onClick={() => handleIntensityChange(key)}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all flex flex-col items-center gap-0.5 ${
                      workoutIntensity === key
                        ? "bg-white border-[2px] shadow-md"
                        : "bg-[#F9FAF8] border-[#E2E4DC] text-textMuted hover:border-gray-300"
                    }`}
                    style={workoutIntensity === key ? { borderColor: color, color } : {}}
                  >
                    <span className="text-base">{emoji}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main layout: Segments + Tumbler */}
            <div className="flex flex-col md:flex-row items-center gap-6">

              {/* Time-of-day segments */}
              <div className="flex-1 w-full space-y-2.5">
                {getTimeSegments(hydrationML, waterGoal).map((seg) => {
                  const segPct = Math.min(100, Math.round((seg.consumed / seg.target) * 100));
                  return (
                    <div key={seg.label} className={`rounded-xl p-3 border transition-all ${
                      seg.active ? "bg-[#EBF2F8] border-[#B8D4EB]" : "bg-[#F9FAF8] border-[#E2E4DC]"
                    }`}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-bold text-textHeading flex items-center gap-1.5">
                          {seg.icon} {seg.label}
                          {seg.active && <span className="text-[9px] bg-[#7A9EBE] text-white px-1.5 py-0.5 rounded-full font-bold">NOW</span>}
                        </span>
                        <span className="text-[10px] font-semibold text-textMuted">
                          {(seg.consumed/1000).toFixed(2)}L / {(seg.target/1000).toFixed(2)}L
                        </span>
                      </div>
                      <div className="h-1.5 bg-white rounded-full overflow-hidden border border-[#D4E6D5]/50">
                        <div
                          className="h-full bg-[#7A9EBE] rounded-full transition-all duration-700"
                          style={{ width: `${segPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Quick log buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {[
                    { ml: 150, label: "Cup", emoji: "🥛" },
                    { ml: 250, label: "Glass", emoji: "🥛" },
                    { ml: 500, label: "Bottle", emoji: "🍼" },
                    { ml: 750, label: "Shaker", emoji: "🥤" },
                  ].map(({ ml, label, emoji }) => (
                    <button
                      key={ml}
                      onClick={() => handleAddWater(ml)}
                      className="px-3 py-2 bg-[#F9FAF8] border border-[#E2E4DC] hover:border-[#7A9EBE] hover:bg-[#EBF2F8] text-textHeading hover:text-[#7A9EBE] rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      {emoji} +{ml}ml {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Animated Tumbler SVG */}
              <div className="relative w-28 h-32 flex-shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 100 120" className="w-full h-full">
                  <defs>
                    <clipPath id="glass-water-clip-v2">
                      <path d="M 28 12 L 34 104 A 6 6 0 0 0 40 110 L 60 110 A 6 6 0 0 0 66 104 L 72 12 Z" />
                    </clipPath>
                  </defs>
                  <g clipPath="url(#glass-water-clip-v2)">
                    <rect x="0" y={112 - (hydrationPercent * 1.0)} width="100" height="120" fill="#7A9EBE" className="transition-all duration-1000 ease-out" opacity="0.85" />
                    <path d="M 0 10 Q 20 5, 40 10 T 80 10 T 120 10 T 160 10 T 200 10 L 200 120 L 0 120 Z" fill="#7A9EBE" transform={`translate(0, ${100 - (hydrationPercent * 1.0)})`} className="wave-animate-1 transition-all duration-1000 ease-out opacity-70" />
                    <path d="M 0 10 Q 25 15, 50 10 T 100 10 T 150 10 T 200 10 L 200 120 L 0 120 Z" fill="#5F88AD" transform={`translate(0, ${102 - (hydrationPercent * 1.0)})`} className="wave-animate-2 transition-all duration-1000 ease-out" />
                  </g>
                  <path d="M 27 10 L 33 105 A 8 8 0 0 0 41 112 L 59 112 A 8 8 0 0 0 67 105 L 73 10" fill="none" stroke="#E2E4DC" strokeWidth="3.5" strokeLinecap="round" />
                  <line x1="68" y1="30" x2="72" y2="30" stroke="#E2E4DC" strokeWidth="1.5" />
                  <line x1="66" y1="60" x2="70" y2="60" stroke="#E2E4DC" strokeWidth="1.5" />
                  <line x1="64" y1="90" x2="68" y2="90" stroke="#E2E4DC" strokeWidth="1.5" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-4">
                  <span className="text-sm font-black text-textHeading drop-shadow-md select-none bg-white/70 px-2 py-0.5 rounded-full border border-border/40">
                    {hydrationPercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Coach Tip */}
            <div className="mt-4 pt-4 border-t border-[#F5F5F0] flex items-start gap-2">
              <span className="text-base">💡</span>
              <p className="text-[11px] text-textMuted leading-relaxed">
                {getHydrationTip(workoutIntensity, hydrationPercent)}
              </p>
            </div>
          </section>
        </div>

        {/* Right Column (Daily Progress, Calorie Trends, Yoga Card) */}
        <div className="space-y-8">
          
          {/* Daily Progress */}
          <div className="space-y-4 animate-slide-up">
            <h2 className="text-xs font-bold text-textHeading uppercase tracking-wider">Daily Progress</h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Steps Card */}
              <div className="bg-white border border-[#7A9E7E]/20 rounded-2xl p-4 shadow-[0_2px_12px_-3px_rgba(122,158,126,0.06)] hover:shadow-[0_4px_16px_-2px_rgba(122,158,126,0.12)] transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between h-32">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-textMuted font-semibold">Steps</span>
                  <span className="w-7 h-7 rounded-full bg-[#EBF2EB] border border-[#D4E6D5] flex items-center justify-center text-xs">
                    👣
                  </span>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-textHeading">8,432 <span className="text-xs text-textMuted font-medium">steps</span></div>
                  <div className="w-full bg-[#F5F5F0] h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="bg-[#7A9E7E] h-full rounded-full" style={{ width: "84%" }} />
                  </div>
                </div>
              </div>

              {/* Calories Card */}
              {(() => {
                const calPct = Math.min(100, Math.round((todayMacros.calories / GOALS.calories) * 100));
                return (
                  <div className="bg-white border border-[#E8815A]/20 rounded-2xl p-4 shadow-[0_2px_12px_-3px_rgba(232,129,90,0.06)] hover:shadow-[0_4px_16px_-2px_rgba(232,129,90,0.12)] transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-textMuted font-semibold">Calories</span>
                      <span className="w-7 h-7 rounded-full bg-[#FEF0EB] border border-[#FEE2D5] flex items-center justify-center text-xs">
                        🔥
                      </span>
                    </div>
                    <div>
                      <div className="text-xl font-extrabold text-textHeading">
                        {todayMacros.calories.toLocaleString()} <span className="text-xs text-textMuted font-medium">kcal</span>
                      </div>
                      <div className="w-full bg-[#F5F5F0] h-1.5 rounded-full overflow-hidden mt-2">
                        <div className="bg-[#E8815A] h-full rounded-full transition-all duration-500" style={{ width: `${calPct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Sleep Card */}
              {(() => {
                const todayStr = new Date().toISOString().split("T")[0];
                const todaySleepLog = sleepLogs.find(log => log.date === todayStr);
                const sleepHrs = todaySleepLog ? todaySleepLog.duration_hours : 0;
                const sleepLabel = sleepHrs > 0 ? `${sleepHrs} hrs` : "0.0 hrs";
                const sleepPct = sleepHrs > 0 ? Math.min(100, Math.round((sleepHrs / 8) * 100)) : 0;
                return (
                  <div className="bg-white border border-[#7A9EBE]/20 rounded-2xl p-4 shadow-[0_2px_12px_-3px_rgba(122,158,190,0.06)] hover:shadow-[0_4px_16px_-2px_rgba(122,158,190,0.12)] transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-textMuted font-semibold">Sleep</span>
                      <span className="w-7 h-7 rounded-full bg-[#EBF2F8] border border-blueLight flex items-center justify-center text-xs">
                        🌙
                      </span>
                    </div>
                    <div>
                      <div className="text-xl font-extrabold text-textHeading">{sleepLabel}</div>
                      <div className="w-full bg-[#F5F5F0] h-1.5 rounded-full overflow-hidden mt-2">
                        <div className="bg-[#7A9EBE] h-full rounded-full transition-all duration-500" style={{ width: `${sleepPct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Active Card */}
              {(() => {
                const todayStr = new Date().toISOString().split("T")[0];
                const todayWorkoutLogs = workoutLogs.filter(log => log.date === todayStr);
                const activeMins = todayWorkoutLogs.reduce((sum, log) => sum + (log.duration_mins || 0), 0);
                const activeLabel = activeMins > 0 ? `${activeMins} min` : "0 min";
                const activePct = activeMins > 0 ? Math.min(100, Math.round((activeMins / 60) * 100)) : 0;
                return (
                  <div className="bg-white border border-[#D4A847]/20 rounded-2xl p-4 shadow-[0_2px_12px_-3px_rgba(212,168,71,0.06)] hover:shadow-[0_4px_16px_-2px_rgba(212,168,71,0.12)] transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-textMuted font-semibold">Active</span>
                      <span className="w-7 h-7 rounded-full bg-[#FEF9EB] border border-[#FDF0CD] flex items-center justify-center text-xs">
                        ⚡
                      </span>
                    </div>
                    <div>
                      <div className="text-xl font-extrabold text-textHeading">{activeLabel}</div>
                      <div className="w-full bg-[#F5F5F0] h-1.5 rounded-full overflow-hidden mt-2">
                        <div className="bg-[#D4A847] h-full rounded-full transition-all duration-500" style={{ width: `${activePct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Calorie Trends Chart */}
          <section className="bg-white rounded-[24px] border border-border p-6 shadow-sm card-hover animate-slide-up">
            <h2 className="text-base font-bold text-textHeading mb-4 uppercase tracking-wider">Calorie Trends</h2>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={calorieTrendData} margin={{ left: 5, right: 5, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="calorieTrendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9DB89F" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#9DB89F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#888888", fontSize: 11, fontWeight: 600 }} />
                  <Tooltip content={CustomTooltip} />
                  <Area 
                    type="monotone" 
                    dataKey="calories" 
                    stroke="#9DB89F" 
                    strokeWidth={2} 
                    fill="url(#calorieTrendFill)" 
                    dot={{ fill: "#9DB89F", r: 4, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* ── Feature 3: Daily AI Macro Advisor Card ── */}
          <section className="bg-gradient-to-br from-[#EBF2EB] to-[#DFF0E0] border border-[#D4E6D5] rounded-[24px] p-5 shadow-sm animate-slide-up">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🧠</span>
                <div>
                  <h3 className="font-extrabold text-[#2C3E2B] text-sm">Daily Macro Advisor</h3>
                  <p className="text-[10px] text-[#5A7A58] font-medium">AI-powered nutrition coaching</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate?.("/insights")}
                className="text-[10px] font-bold text-[#7A9E7E] hover:text-[#5C7A60] transition-colors border border-[#D4E6D5] bg-white/60 px-2.5 py-1 rounded-full"
              >
                Full Insights →
              </button>
            </div>

            {/* Today's macro mini-bars */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: "Calories", val: todayMacros.calories, goal: GOALS.calories, color: "#E8815A", unit: "kcal" },
                { label: "Protein", val: todayMacros.protein, goal: GOALS.protein, color: "#9DB89F", unit: "g" },
                { label: "Carbs", val: todayMacros.carbs, goal: GOALS.carbs, color: "#D4A847", unit: "g" },
                { label: "Fat", val: todayMacros.fat, goal: GOALS.fat, color: "#7A9EBE", unit: "g" },
              ].map(({ label, val, goal, color, unit }) => {
                const pct = Math.min(100, Math.round((val / goal) * 100));
                return (
                  <div key={label} className="bg-white/70 rounded-xl p-2.5 border border-white/80">
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-[10px] font-bold text-textMuted">{label}</span>
                      <span className="text-[10px] font-extrabold" style={{ color }}>
                        {val}<span className="text-[8px] text-textMuted font-semibold">/{goal}{unit}</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/60 rounded-full overflow-hidden border border-white/40">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coaching advice bubble */}
            <div className="bg-white/80 rounded-xl p-3.5 border border-[#D4E6D5]/70 flex items-start gap-2.5">
              <span className="text-base mt-0.5">💡</span>
              <p className="text-[11px] text-[#2C3E2B] leading-relaxed font-medium">
                {macroAdvice || "Loading your daily macro snapshot..."}
              </p>
            </div>
          </section>

          {/* ── Feature 6: Meal Streak & Consistency Score ── */}
          <section className="bg-white rounded-[24px] border border-border p-5 shadow-sm animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔥</span>
                <div>
                  <h3 className="font-extrabold text-textHeading text-sm">Logging Streak</h3>
                  <p className="text-[10px] text-textMuted font-medium">Consistency builds results</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-[#E8815A]">{mealStreak}</span>
                <p className="text-[9px] text-textMuted font-bold uppercase">day streak</p>
              </div>
            </div>

            {/* Weekly Heatmap */}
            <div className="flex gap-1.5 mb-4">
              {["M","T","W","T","F","S","S"].map((day, i) => {
                const logged = mealLogsWeek[i];
                const isToday = i === new Date().getDay() - 1 || (new Date().getDay() === 0 && i === 6);
                return (
                  <div key={`${day}-${i}`} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold text-textMuted">{day}</span>
                    <div className={`w-full aspect-square rounded-lg border-2 flex items-center justify-center transition-all ${
                      isToday
                        ? "border-[#E8815A] bg-[#FEF0EB]"
                        : logged
                          ? "border-[#9DB89F] bg-[#EBF2EB]"
                          : "border-[#E2E4DC] bg-[#F9FAF8]"
                    }`}>
                      <span className="text-xs">
                        {logged ? "✅" : isToday ? "📍" : "·"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Consistency Score */}
            <div className="flex items-center gap-4 bg-gradient-to-r from-[#EBF2EB] to-[#F5F5F0] rounded-xl p-3 border border-[#D4E6D5]">
              <div className="relative w-12 h-12 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#E2E4DC" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15" fill="none"
                    stroke="#9DB89F" strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${consistencyScore * 0.942} ${100 * 0.942}`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-[#2C3E2B]">{consistencyScore}%</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-textHeading">Consistency Score</p>
                <p className="text-[10px] text-textMuted leading-relaxed mt-0.5">
                  You've maintained a {consistencyScore}% food logging consistency over the last 7 days! Keep it up! 🎯
                </p>
              </div>
            </div>
          </section>

          {/* Evening Yoga Card */}
          <section 
            onClick={() => onNavigate?.("/workouts")}
            className="bg-[#EBF2EB] border border-[#D4E6D5] rounded-2xl p-4 flex items-center justify-between cursor-pointer card-hover animate-slide-up"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#2C3E2B] shadow-sm">
                {/* Dumbbell Icon */}
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
                  <path d="M6.5 12h11M4 12H2M22 12h-2M6.5 8l-2 4 2 4M17.5 8l2 4-2 4" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-textHeading text-sm">Evening Yoga</h3>
                <p className="text-xs text-textMuted">15 min • Restorative Flow</p>
              </div>
            </div>
            <span className="text-textMuted text-lg font-bold">&gt;</span>
          </section>
        </div>
      </main>

      {/* Floating Action Button (FAB) for Scan Meal */}
      <button 
        onClick={handleOpenModal}
        className="fixed bottom-8 right-8 flex items-center gap-2 px-6 py-3.5 bg-[#9DB89F] hover:bg-[#7A9E7E] text-white rounded-full font-bold shadow-lg shadow-[#9DB89F]/30 hover:scale-105 active:scale-95 transition-all z-20"
      >
        <CameraIcon className="w-5 h-5" />
        <span>Scan Meal</span>
      </button>

      {/* Suggested Recipe Detail Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-[32px] border border-border shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col animate-slide-up">
            
            {/* Modal Image Header */}
            <div className="relative h-56 shrink-0 text-left">
              <img 
                src={selectedRecipe.image} 
                alt={selectedRecipe.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <button 
                onClick={() => setSelectedRecipe(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
              <div className="absolute bottom-4 left-6 right-6 text-white">
                <span className="px-2.5 py-0.5 rounded-full bg-[#9DB89F] text-white text-[10px] font-bold uppercase tracking-wider">
                  {selectedRecipe.type} Suggested Recipe
                </span>
                <h3 className="text-2xl font-black mt-1.5">{selectedRecipe.name}</h3>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-left">
              {/* Prep time & macros */}
              <div className="grid grid-cols-4 gap-2 bg-[#F8F9FA] rounded-2xl p-3 border border-border">
                <div className="text-center">
                  <p className="text-[10px] text-textMuted font-bold uppercase">Time</p>
                  <p className="text-xs font-black text-textHeading mt-0.5">{selectedRecipe.prepTime}</p>
                </div>
                <div className="text-center border-l border-border">
                  <p className="text-[10px] text-orange-600 font-bold uppercase">Calories</p>
                  <p className="text-xs font-black text-orange-600 mt-0.5">{selectedRecipe.calories} kcal</p>
                </div>
                <div className="text-center border-l border-border">
                  <p className="text-[10px] text-textHeading font-bold uppercase">Protein</p>
                  <p className="text-xs font-black text-textHeading mt-0.5">{selectedRecipe.protein}g</p>
                </div>
                <div className="text-center border-l border-border">
                  <p className="text-[10px] text-textMuted font-bold uppercase">Carbs / Fat</p>
                  <p className="text-xs font-black text-textHeading mt-0.5">{selectedRecipe.carbs}g / {selectedRecipe.fat}g</p>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <h4 className="text-xs font-bold text-textHeading uppercase tracking-wider mb-2">Ingredients Needed</h4>
                <ul className="space-y-1.5">
                  {selectedRecipe.ingredients.map((ing: string, i: number) => (
                    <li key={i} className="text-xs text-textBody flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9DB89F]"></span> {ing}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div>
                <h4 className="text-xs font-bold text-textHeading uppercase tracking-wider mb-2">Preparation Instructions</h4>
                <ol className="space-y-2.5">
                  {selectedRecipe.instructions.map((step: string, i: number) => (
                    <li key={i} className="text-xs text-textBody flex gap-2.5 items-start">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#EBF2EBF2] border border-[#D4E6D5] text-[#2C3E2B] text-[10px] font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-6 border-t border-border bg-[#F5F6F1]/30 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setSelectedRecipe(null)}
                className="px-5 py-2.5 bg-white border border-[#E2E4DC] hover:bg-surfaceAlt text-textHeading text-xs font-bold rounded-full transition-all"
              >
                Close
              </button>
              <button 
                onClick={async () => {
                  try {
                    setIsLoggingRecipe(true);
                    await logCustomMealRequest({
                      name: selectedRecipe.name,
                      calories: selectedRecipe.calories,
                      protein: selectedRecipe.protein,
                      carbs: selectedRecipe.carbs,
                      fat: selectedRecipe.fat,
                      mealType: selectedRecipe.type,
                      imageUrl: selectedRecipe.image
                    });
                    // Refresh stats and meals
                    await loadDashboardStats();
                    setSelectedRecipe(null);
                    if (onUploadSuccess) onUploadSuccess();
                  } catch (err) {
                    console.error("Failed to log recipe suggestion", err);
                  } finally {
                    setIsLoggingRecipe(false);
                  }
                }}
                disabled={isLoggingRecipe}
                className="px-6 py-2.5 bg-[#9DB89F] hover:bg-[#7A9E7E] text-white text-xs font-bold rounded-full transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {isLoggingRecipe ? (
                  <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <span>✓</span>
                )}
                Add to Daily Log
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Overlay Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <style>{`
            @keyframes soundWave {
              0%, 100% { height: 8px; }
              50% { height: 28px; }
            }
            .sound-bar {
              animation: soundWave 1.2s ease-in-out infinite;
            }
          `}</style>
          <div className="bg-white rounded-[32px] w-full max-w-2xl border border-border shadow-2xl relative p-8">
            <button 
              onClick={handleCloseModal}
              className="absolute top-6 right-6 text-textMuted hover:text-textHeading transition-colors"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
            <div className="mb-4 text-center">
              <h2 className="text-2xl font-bold text-textHeading tracking-tight">Log Your Meal</h2>
              <p className="text-textMuted text-xs mt-1">Get an AI-powered nutritional breakdown using images or voice logs</p>
            </div>

            {/* Tab switch pills */}
            <div className="flex gap-2 p-1 bg-[#F5F5F0] rounded-full border border-border w-fit mx-auto mb-6">
              <button
                type="button"
                onClick={() => {
                  clearError();
                  setSpeechError("");
                  setLoggingMode("image");
                }}
                className={`px-5 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all ${
                  loggingMode === "image"
                    ? "bg-[#9DB89F] text-white shadow-sm"
                    : "text-textMuted hover:text-textHeading"
                }`}
              >
                <CameraIcon className="w-3.5 h-3.5" />
                Image Scan
              </button>
              <button
                type="button"
                onClick={() => {
                  clearError();
                  setSpeechError("");
                  setLoggingMode("voice");
                }}
                className={`px-5 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all ${
                  loggingMode === "voice"
                    ? "bg-[#9DB89F] text-white shadow-sm"
                    : "text-textMuted hover:text-textHeading"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                  <path d="M12 1v11m0 0a3 3 0 003-3V4a3 3 0 00-6 0v5a3 3 0 003 3zm0 0v4m-5-4a7 7 0 0010 0" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Voice Log
              </button>
              <button
                type="button"
                onClick={() => {
                  clearError();
                  setSpeechError("");
                  setLoggingMode("barcode");
                }}
                className={`px-5 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all ${
                  loggingMode === "barcode"
                    ? "bg-[#9DB89F] text-white shadow-sm"
                    : "text-textMuted hover:text-textHeading"
                }`}
              >
                {/* Barcode icon */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 12v1.5m0 0v1.5m0-1.5h1.5m-1.5 0h-1.5M13.5 17.25h1.5m0 0H15m0 0h1.5m0 0h1.5M13.5 19.5h1.5m-3-4.5h1.5m-1.5 1.5h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm1.5-1.5h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm3-1.5h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm1.5-3h.008v.008h-.008v-.008Zm0 1.5h.008v.008h-.008v-.008Z" />
                </svg>
                Barcode Scan
              </button>
            </div>
            
            <div className="mt-4">
              {loggingMode === "image" ? (
                <div className="space-y-4">
                  <div className="w-full max-w-2xl mx-auto bg-[#F5F6F1] border border-border rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                    <label htmlFor="dishNameInput" className="text-xs font-bold text-textHeading flex items-center gap-1.5">
                      <span>🍽️ What is this dish? (Optional hint)</span>
                    </label>
                    <input
                      id="dishNameInput"
                      type="text"
                      value={uploadDishName}
                      onChange={(e) => setUploadDishName(e.target.value)}
                      placeholder="e.g. Pav Bhaji, Lobia Curry with Roti, Chole Bhature..."
                      className="w-full bg-white border border-[#E2E4DC] focus:border-primary rounded-xl px-3.5 py-2.5 text-sm font-semibold text-textHeading outline-none transition-all shadow-inner"
                      disabled={isUploading}
                    />
                    <span className="text-[10px] text-textMuted font-medium">
                      Providing the dish name guides the AI to map ingredients with 100% precision.
                    </span>
                  </div>

                  <UploadCard
                    dragActive={dragActive}
                    errorMessage={errorMessage}
                    isUploading={isUploading}
                    onDragChange={(active) => {
                      clearError();
                      setDragActive(active);
                    }}
                    onFileSelected={handleFileSelected}
                  />
                </div>
              ) : loggingMode === "voice" ? (
                <div className="w-full flex flex-col items-center">
                  {/* Waveform Visualizer */}
                  <div className="flex justify-center items-end gap-1 h-8 mb-4">
                    {isRecording ? (
                      <>
                        <div className="w-1 bg-[#7A9E7E] rounded-full sound-bar" style={{ animationDelay: '0.1s' }} />
                        <div className="w-1 bg-[#7A9E7E] rounded-full sound-bar" style={{ animationDelay: '0.3s' }} />
                        <div className="w-1 bg-[#7A9E7E] rounded-full sound-bar" style={{ animationDelay: '0.5s' }} />
                        <div className="w-1 bg-[#7A9E7E] rounded-full sound-bar" style={{ animationDelay: '0.2s' }} />
                        <div className="w-1 bg-[#7A9E7E] rounded-full sound-bar" style={{ animationDelay: '0.4s' }} />
                      </>
                    ) : (
                      <>
                        <div className="w-1 bg-border rounded-full h-2" />
                        <div className="w-1 bg-border rounded-full h-2" />
                        <div className="w-1 bg-border rounded-full h-2" />
                        <div className="w-1 bg-border rounded-full h-2" />
                        <div className="w-1 bg-border rounded-full h-2" />
                      </>
                    )}
                  </div>

                  {/* Pulsing Mic Button */}
                  <div className="relative flex items-center justify-center mb-4">
                    {isRecording && (
                      <>
                        <span className="absolute inline-flex h-20 w-20 rounded-full bg-rose/30 animate-ping"></span>
                        <span className="absolute inline-flex h-16 w-16 rounded-full bg-rose/40 animate-pulse"></span>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={toggleRecording}
                      className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 ${
                        isRecording 
                          ? "bg-rose text-white hover:bg-rose/90 shadow-rose/20" 
                          : "bg-[#F5F6F1] border border-border text-[#7A9E7E] hover:border-[#7A9E7E]"
                      }`}
                    >
                      {isRecording ? (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                          <rect x="6" y="6" width="12" height="12" rx="2" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6">
                          <path d="M12 1v11m0 0a3 3 0 003-3V4a3 3 0 00-6 0v5a3 3 0 003 3zm0 0v4m-5-4a7 7 0 0010 0" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <p className="text-xs font-bold text-textMuted uppercase tracking-wider mb-6">
                    {isRecording ? "Listening... speak clearly" : "Tap microphone to record meal description"}
                  </p>

                  {/* Textarea Fallback / Transcript display */}
                  <div className="w-full text-left mb-6">
                    <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">
                      Meal Transcript
                    </label>
                    <textarea
                      value={voiceTranscript}
                      onChange={(e) => setVoiceTranscript(e.target.value)}
                      placeholder="e.g. 'I had two scrambled eggs with spinach and a cup of coffee with a splash of milk...'"
                      disabled={isUploading}
                      className="w-full min-h-[120px] p-4 bg-[#F9FAF8] border border-border focus:border-[#7A9E7E] focus:ring-1 focus:ring-[#7A9E7E] rounded-2xl text-textHeading text-sm outline-none resize-none font-medium transition-all shadow-sm"
                    />
                  </div>

                  {/* Errors */}
                  {(speechError || errorMessage) && (
                    <div className="w-full mb-6 rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs font-medium text-danger text-center animate-fade-in">
                      {speechError || errorMessage}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="button"
                    onClick={handleVoiceSubmit}
                    disabled={isUploading || isRecording || !voiceTranscript.trim()}
                    className="w-full max-w-sm px-6 py-3.5 rounded-xl bg-[#9DB89F] hover:bg-[#7A9E7E] text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm mb-2"
                  >
                    {isUploading ? (
                      <SpinnerIcon className="h-5 w-5 animate-spin text-white" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-white">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {isUploading ? progressMessage || "Analyzing..." : "Submit Voice Log"}
                  </button>
                </div>
              ) : (
                <BarcodeScanner
                  onDetected={handleBarcodeDetected}
                  isSearching={isUploading}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
