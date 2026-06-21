import { useEffect, useState } from "react";
import { fetchProfileRequest, generateDietPlanRequest, generateGroceryListRequest } from "../services/profileApi";
import type { UserProfile, DailyDietPlan } from "../types";
import { SparklesIcon, CalendarIcon, BoltIcon, FireIcon, ProteinIcon } from "../components/icons";
import { GroceryListModal } from "../components/GroceryListModal";

export const DietPlanPage = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("Tuesday");
  const [groceryList, setGroceryList] = useState<any[]>([]);
  const [isGroceryLoading, setIsGroceryLoading] = useState(false);
  const [isGroceryOpen, setIsGroceryOpen] = useState(false);

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
    if (mealType.toLowerCase().includes("breakfast") || mealType.toLowerCase().includes("toast")) {
      return "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=600&auto=format&fit=crop&q=80";
    }
    if (mealType.toLowerCase().includes("lunch") || mealType.toLowerCase().includes("quinoa")) {
      return "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=600&auto=format&fit=crop&q=80";
    }
    return "https://images.unsplash.com/photo-1485921325814-a5dad423a3b6?w=600&auto=format&fit=crop&q=80"; // Salmon
  };

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  // Custom mock plan list if none generated yet to match mockup screenshot
  const defaultDietPlan: DailyDietPlan[] = [
    {
      day: "Monday",
      totalCalories: 1850,
      totalProtein: 110,
      totalCarbs: 210,
      totalFat: 60,
      meals: [
        { type: "Breakfast", name: "Oatmeal with berries", description: "Steel cut oats with fruit", calories: 400, protein: 15, carbs: 65, fat: 8 }
      ]
    },
    {
      day: "Tuesday",
      totalCalories: 1920,
      totalProtein: 120,
      totalCarbs: 220,
      totalFat: 65,
      meals: [
        { type: "Breakfast", name: "Avocado Toast with Poached Egg", description: "Whole grain sourdough, smashed avocado, and two organic eggs.", calories: 420, protein: 18, carbs: 32, fat: 12 },
        { type: "Lunch", name: "Mediterranean Quinoa Bowl", description: "Fresh cucumbers, feta cheese, chickpeas, and lemon-herb dressing.", calories: 580, protein: 14, carbs: 45, fat: 16 },
        { type: "Dinner", name: "Grilled Salmon & Asparagus", description: "Wild-caught salmon with roasted garlic asparagus and brown rice.", calories: 650, protein: 38, carbs: 20, fat: 22 }
      ]
    },
    {
      day: "Wednesday",
      totalCalories: 1700,
      totalProtein: 105,
      totalCarbs: 180,
      totalFat: 55,
      meals: []
    },
    {
      day: "Thursday",
      totalCalories: 2100,
      totalProtein: 130,
      totalCarbs: 240,
      totalFat: 70,
      meals: []
    },
    {
      day: "Friday",
      totalCalories: 1880,
      totalProtein: 115,
      totalCarbs: 215,
      totalFat: 60,
      meals: []
    }
  ];

  const planList = profile?.dietPlan && profile.dietPlan.length > 0 ? profile.dietPlan : defaultDietPlan;
  const activePlan = planList.find(d => d.day === selectedDay) || planList[1];

  const getDayLabel = (day: string) => {
    switch (day) {
      case "Monday": return { num: "23", title: "Detox & High Pr...", label: "MON", count: "4 Meals" };
      case "Tuesday": return { num: "24", title: "Balanced Energy", label: "TUE", count: "3 Meals" };
      case "Wednesday": return { num: "25", title: "Low Carb Focus", label: "WED", count: "4 Meals" };
      case "Thursday": return { num: "26", title: "Muscle Recovery", label: "THU", count: "5 Meals" };
      case "Friday": return { num: "27", title: "Healthy Fats", label: "FRI", count: "3 Meals" };
      default: return { num: "28", title: "Standard Diet", label: "SAT", count: "3 Meals" };
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
          <div className="text-sm font-bold text-textHeading uppercase tracking-wider mb-2">October 2023</div>
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
                      <button className="text-textMuted hover:text-textHeading text-base leading-none">⋮</button>
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
    </div>
  );
};
