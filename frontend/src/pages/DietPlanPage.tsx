import { useEffect, useState, useMemo } from "react";
import { fetchProfileRequest, generateDietPlanRequest, generateGroceryListRequest, modifyDietPlanMealRequest } from "../services/profileApi";
import type { UserProfile, DailyDietPlan } from "../types";
import { SparklesIcon, CalendarIcon, BoltIcon, FireIcon, ProteinIcon } from "../components/icons";
import { GroceryListModal } from "../components/GroceryListModal";
import { getMealFallbackImage } from "../utils/imageHelper";

export const DietPlanPage = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("Tuesday");
  const [groceryList, setGroceryList] = useState<any[]>([]);
  const [isGroceryLoading, setIsGroceryLoading] = useState(false);
  const [isGroceryOpen, setIsGroceryOpen] = useState(false);

  // AI Meal Swapper state
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [swapPrompt, setSwapPrompt] = useState("");
  const [swapDay, setSwapDay] = useState("");
  const [swapIndex, setSwapIndex] = useState<number>(0);
  const [isSwapping, setIsSwapping] = useState(false);

  // Calculate date information for the current week (Monday - Sunday) to make the calendar real-time
  const currentWeekDays = useMemo(() => {
    const today = new Date();
    const day = today.getDay();
    const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diffToMonday));
    
    const week = [];
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      week.push({
        dayName: dayNames[i],
        dateNum: d.getDate().toString(),
        monthYear: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      });
    }
    return week;
  }, []);

  const currentMonthYear = useMemo(() => {
    if (currentWeekDays.length > 0) {
      return currentWeekDays[0].monthYear;
    }
    return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [currentWeekDays]);

  // Custom mock plan list scaled dynamically to match the user's calculated caloric targets
  const defaultDietPlan: DailyDietPlan[] = useMemo(() => {
    const targetCal = profile?.maintenanceCalories || 1900;
    const scaleFactor = targetCal / 1900;

    return [
      {
        day: "Monday",
        totalCalories: Math.round(1850 * scaleFactor),
        totalProtein: Math.round(110 * scaleFactor),
        totalCarbs: Math.round(210 * scaleFactor),
        totalFat: Math.round(60 * scaleFactor),
        meals: [
          { type: "Breakfast", name: "Oatmeal with berries", description: "Steel cut oats with fruit", calories: Math.round(400 * scaleFactor), protein: Math.round(15 * scaleFactor), carbs: Math.round(65 * scaleFactor), fat: Math.round(8 * scaleFactor) }
        ]
      },
      {
        day: "Tuesday",
        totalCalories: Math.round(1920 * scaleFactor),
        totalProtein: Math.round(120 * scaleFactor),
        totalCarbs: Math.round(220 * scaleFactor),
        totalFat: Math.round(65 * scaleFactor),
        meals: [
          { type: "Breakfast", name: "Avocado Toast with Poached Egg", description: "Whole grain sourdough, smashed avocado, and two organic eggs.", calories: Math.round(420 * scaleFactor), protein: Math.round(18 * scaleFactor), carbs: Math.round(32 * scaleFactor), fat: Math.round(12 * scaleFactor) },
          { type: "Lunch", name: "Mediterranean Quinoa Bowl", description: "Fresh cucumbers, feta cheese, chickpeas, and lemon-herb dressing.", calories: Math.round(580 * scaleFactor), protein: Math.round(14 * scaleFactor), carbs: Math.round(45 * scaleFactor), fat: Math.round(16 * scaleFactor) },
          { type: "Dinner", name: "Grilled Salmon & Asparagus", description: "Wild-caught salmon with roasted garlic asparagus and brown rice.", calories: Math.round(650 * scaleFactor), protein: Math.round(38 * scaleFactor), carbs: Math.round(20 * scaleFactor), fat: Math.round(22 * scaleFactor) }
        ]
      },
      {
        day: "Wednesday",
        totalCalories: Math.round(1700 * scaleFactor),
        totalProtein: Math.round(105 * scaleFactor),
        totalCarbs: Math.round(180 * scaleFactor),
        totalFat: Math.round(55 * scaleFactor),
        meals: []
      },
      {
        day: "Thursday",
        totalCalories: Math.round(2100 * scaleFactor),
        totalProtein: Math.round(130 * scaleFactor),
        totalCarbs: Math.round(240 * scaleFactor),
        totalFat: Math.round(70 * scaleFactor),
        meals: []
      },
      {
        day: "Friday",
        totalCalories: Math.round(1880 * scaleFactor),
        totalProtein: Math.round(115 * scaleFactor),
        totalCarbs: Math.round(215 * scaleFactor),
        totalFat: Math.round(60 * scaleFactor),
        meals: []
      }
    ];
  }, [profile]);

  const handleOpenSwapModal = (day: string, idx: number) => {
    setSwapDay(day);
    setSwapIndex(idx);
    setSwapPrompt("");
    setIsSwapModalOpen(true);
  };

  const handleSwapMeal = async () => {
    if (!swapPrompt.trim() || !swapDay) return;
    setIsSwapping(true);
    setError(null);
    try {
      const res = await modifyDietPlanMealRequest(swapDay, swapIndex, swapPrompt);
      if (res.success) {
        setProfile(prev => prev ? { ...prev, dietPlan: res.data } : null);
        setIsSwapModalOpen(false);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error?.message || "Failed to customize meal.");
    } finally {
      setIsSwapping(false);
    }
  };

  const loadProfile = async () => {
    try {
      const res = await fetchProfileRequest();
      if (res.success) setProfile(res.data);
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await generateDietPlanRequest();
      setProfile(prev => prev ? { ...prev, dietPlan: res.data } : null);
      if (res.data && res.data.length > 0) {
        setSelectedDay(res.data[0].day);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || "Failed to generate diet plan.");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateGrocery = async () => {
    setIsGroceryLoading(true);
    setError(null);
    try {
      const res = await generateGroceryListRequest();
      setGroceryList(res.data);
      setIsGroceryOpen(true);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || "Failed to generate grocery list.");
    } finally {
      setIsGroceryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-background pb-24 px-4 sm:px-8 pt-8 animate-pulse">
        <header className="max-w-6xl mx-auto w-full flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-[#E2E4DC] rounded-xl" />
            <div className="h-4 w-72 bg-[#E2E4DC]/60 rounded-lg" />
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="h-10 w-32 bg-[#E2E4DC] rounded-full" />
            <div className="h-10 w-32 bg-[#E2E4DC] rounded-full" />
          </div>
        </header>
        <main className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.1fr_1.4fr] gap-8">
          <div className="space-y-4">
            <div className="h-6 w-24 bg-[#E2E4DC] rounded-lg mb-2" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-white border border-border rounded-3xl" />
            ))}
          </div>
          <div className="space-y-4">
            <div className="h-6 w-32 bg-[#E2E4DC] rounded-lg mb-2" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white border border-border rounded-[24px]" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Predefined list of mock meal images to show
  const getMealImage = (mealType: string) => {
    return getMealFallbackImage(mealType);
  };

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  const planList = profile?.dietPlan && profile.dietPlan.length > 0 ? profile.dietPlan : defaultDietPlan;
  const activePlan = planList.find(d => d.day === selectedDay) || planList[1];

  const getDayLabel = (day: string) => {
    const dayInfo = currentWeekDays.find(d => d.dayName.toLowerCase() === day.toLowerCase());
    const num = dayInfo ? dayInfo.dateNum : "1";
    const label = day.substring(0, 3).toUpperCase();

    switch (day) {
      case "Monday": return { num, title: "Detox & High Protein", label, count: "4 Meals" };
      case "Tuesday": return { num, title: "Balanced Energy", label, count: "3 Meals" };
      case "Wednesday": return { num, title: "Low Carb Focus", label, count: "4 Meals" };
      case "Thursday": return { num, title: "Muscle Recovery", label, count: "5 Meals" };
      case "Friday": return { num, title: "Healthy Fats", label, count: "3 Meals" };
      default: return { num, title: "Standard Diet", label, count: "3 Meals" };
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-background relative overflow-y-auto pb-24 px-4 sm:px-8 pt-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto w-full flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-textHeading tracking-tight">Weekly Diet Plan</h1>
          <p className="text-textMuted text-sm mt-1">
            Your personalized nutrition strategy for weight loss.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="group flex items-center gap-2 px-6 py-2.5 bg-white border border-[#E2E4DC] hover:border-[#9DB89F]/50 text-textHeading text-xs font-bold rounded-full transition-all duration-300 disabled:opacity-50 shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            {generating ? (
              <div className="animate-spin h-3.5 w-3.5 border-2 border-[#7A9E7E] border-t-transparent rounded-full" />
            ) : (
              <svg className="w-3.5 h-3.5 text-textHeading transition-transform duration-500 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            )}
            Regenerate Plan
          </button>
          <button
            onClick={handleGenerateGrocery}
            disabled={isGroceryLoading}
            className="group flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#9DB89F] to-[#8FA991] hover:from-[#8FA991] hover:to-[#7A9E7E] text-white rounded-full text-xs font-bold transition-all duration-300 disabled:opacity-50 shadow-[0_4px_12px_rgba(157,184,159,0.2)] hover:shadow-[0_6px_18px_rgba(122,158,126,0.3)] hover:-translate-y-0.5"
          >
            {isGroceryLoading ? (
              <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <svg className="w-3.5 h-3.5 text-white transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
            )}
            Grocery List
          </button>
        </div>
      </header>

      {/* Error Alert Banner */}
      {error && (
        <div className="max-w-6xl mx-auto w-full mb-6 p-4 rounded-2xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button 
            onClick={() => setError(null)} 
            className="text-danger hover:text-rose-900 font-bold ml-2 text-sm shrink-0 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid Content */}
      <main className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.1fr_1.4fr] gap-8">
        
        {/* Left Column (Days timeline) */}
        <div className="space-y-6">
          <div className="text-sm font-bold text-textHeading uppercase tracking-wider mb-2">{currentMonthYear}</div>
          <div className="space-y-4">
            {planList.slice(0, 5).map((dayPlan) => {
              const active = selectedDay === dayPlan.day;
              const details = getDayLabel(dayPlan.day);
              return (
                <button
                  key={dayPlan.day}
                  onClick={() => setSelectedDay(dayPlan.day)}
                  className={`w-full flex items-center justify-between p-4 rounded-3xl border transition-all text-left bg-white
                    ${active 
                      ? "border-[#9DB89F] ring-2 ring-[#9DB89F]/20 shadow-md" 
                      : "border-border hover:border-gray-400 shadow-sm"
                    }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Day Badge */}
                    <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-bold text-xs shrink-0
                      ${active 
                        ? "bg-[#EBF2EB] text-[#2C3E2B]" 
                        : "bg-[#F5F6F1] text-textMuted"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold leading-none mb-0.5">{details.label}</span>
                      <span className="text-base leading-none font-extrabold">{details.num}</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-textHeading text-sm">{details.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-textMuted mt-1">
                        <span className="flex items-center gap-1">
                          🔥 {dayPlan.totalCalories || 1800} kcal
                        </span>
                        <span>•</span>
                        <span>🍴 {details.count}</span>
                      </div>
                    </div>
                  </div>

                  {active ? (
                    <div className="w-6 h-6 rounded-full bg-[#EBF2EB] border border-[#D4E6D5] flex items-center justify-center text-[#2C3E2B] text-xs font-bold">
                      ✓
                    </div>
                  ) : (
                    <span className="text-textMuted text-lg font-bold pr-2">&gt;</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column (Meals detail & Pro tip) */}
        <div className="space-y-6">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-xl font-bold text-textHeading">{selectedDay}'s Meals</h2>
            <span className="text-xs font-bold text-textMuted">Oct 24</span>
          </div>

          <div className="space-y-6">
            {activePlan.meals && activePlan.meals.length > 0 ? (
              activePlan.meals.map((meal, idx) => (
                <div 
                  key={idx} 
                  className="bg-white border border-border rounded-[24px] p-4 flex gap-4 hover:shadow-md transition-shadow relative"
                >
                  {/* Meal Thumbnail */}
                  <img 
                    src={getMealImage(meal.name)} 
                    alt={meal.name} 
                    className="w-24 h-24 rounded-2xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#F5F6F1] text-textMuted text-[10px] font-bold uppercase">{meal.type}</span>
                        <span className="text-xs text-textMuted font-semibold">
                          {meal.type.toLowerCase().includes("breakfast") ? "08:00 AM" : meal.type.toLowerCase().includes("lunch") ? "01:00 PM" : "07:30 PM"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenSwapModal(selectedDay, idx)}
                          title="Modify meal with AI"
                          className="text-[#7A9E7E] hover:text-[#2C3E2B] transition-colors p-1"
                        >
                          <SparklesIcon className="w-3.5 h-3.5" />
                        </button>
                        <button className="text-textMuted hover:text-textHeading text-base leading-none">⋮</button>
                      </div>
                    </div>

                    <h3 className="font-bold text-textHeading text-base mt-1.5 truncate">{meal.name}</h3>
                    <p className="text-xs text-textMuted mt-1 leading-relaxed line-clamp-1">{meal.description}</p>
                    
                    {/* Macros info */}
                    <div className="flex items-center gap-4 text-xs font-semibold mt-3 text-textMuted">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#9DB89F]"></span> {meal.protein}g protein
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#E8815A]"></span> {meal.carbs}g carbs
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-[24px] border border-border text-textMuted text-sm font-medium">
                No meals planned for {selectedDay}.
              </div>
            )}

            {/* Pro Tip Card */}
            <section className="bg-[#EBF2EB] border border-[#D4E6D5] rounded-[24px] p-6 shadow-sm flex gap-3.5 items-start">
              <span className="text-xl text-[#2C3E2B] mt-0.5">💡</span>
              <div>
                <h4 className="font-bold text-[#2C3E2B] text-sm">Pro Tip: Hydration</h4>
                <p className="text-xs text-textBody leading-relaxed mt-1">
                  Drinking 500ml of water before your lunch can help boost metabolism and digestion.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <GroceryListModal 
        isOpen={isGroceryOpen} 
        onClose={() => setIsGroceryOpen(false)} 
        list={groceryList} 
      />

      {isSwapModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-textHeading text-lg flex items-center gap-1.5">
                <SparklesIcon className="w-5 h-5 text-[#9DB89F]" />
                Modify Meal with AI
              </h3>
              <button
                onClick={() => setIsSwapModalOpen(false)}
                className="text-textMuted hover:text-textHeading font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-textMuted leading-relaxed">
              Describe how you want to customize this meal (e.g. "I want a high protein eggless version", "use whole wheat bread instead of idli").
            </p>
            <textarea
              value={swapPrompt}
              onChange={(e) => setSwapPrompt(e.target.value)}
              placeholder="e.g. swap with a low carb vegetarian alternative"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-textHeading focus:border-[#7A9E7E] focus:outline-none text-sm resize-none"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setIsSwapModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-background transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSwapMeal}
                disabled={isSwapping || !swapPrompt.trim()}
                className="flex-1 py-2.5 bg-[#9DB89F] hover:bg-[#7A9E7E] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                {isSwapping ? (
                  <>
                    <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                    Swapping...
                  </>
                ) : (
                  "Customize Meal"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
