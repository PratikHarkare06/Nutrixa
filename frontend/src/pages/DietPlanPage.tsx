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
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
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
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !profile?.dietPlan) {
    return (
      <div className="p-8">
        <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-xl">
          {error}
        </div>
      </div>
    );
  }

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const activePlan: DailyDietPlan | undefined = profile?.dietPlan?.find(d => d.day === selectedDay);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-textMain tracking-tight">AI Diet Plan</h1>
          <p className="text-textMuted text-sm mt-1">
            Personalized meal plans built for your {profile?.dietMode || "Balanced"} diet.
          </p>
        </div>
        {profile?.dietPlan && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateGrocery}
              disabled={isGroceryLoading}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-bold hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
            >
              {isGroceryLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <span className="text-lg leading-none">🛒</span>
              )}
              Grocery List
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-panel border border-panelBorder rounded-lg text-sm font-medium text-textMain hover:border-primary transition-colors disabled:opacity-50"
            >
              {generating ? (
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              ) : (
                <SparklesIcon className="w-4 h-4 text-primary" />
              )}
              Regenerate Plan
            </button>
          </div>
        )}
      </div>

      {!profile?.dietPlan ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-panel border border-panelBorder rounded-2xl">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <CalendarIcon className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-textMain mb-2">No Diet Plan Generated Yet</h2>
          <p className="text-textMuted max-w-md mb-8">
            Let our AI nutritionist build a complete 7-day meal plan perfectly optimized for your {profile?.maintenanceCalories} kcal target and {profile?.dietMode} preferences.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50"
          >
            {generating ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                Generating Plan...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                Generate My Custom Plan
              </>
            )}
          </button>
          {error && <p className="text-danger mt-4 text-sm">{error}</p>}
        </div>
      ) : (
        <>
          {/* Day Tabs */}
          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
            {profile.dietPlan.map((dayPlan) => (
              <button
                key={dayPlan.day}
                onClick={() => setSelectedDay(dayPlan.day)}
                className={`px-5 py-2.5 rounded-full whitespace-nowrap font-medium text-sm transition-all ${
                  selectedDay === dayPlan.day
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "bg-panel border border-panelBorder text-textMuted hover:text-textMain hover:border-textMuted/30"
                }`}
              >
                {dayPlan.day}
              </button>
            ))}
          </div>

          {activePlan && (
            <div className="space-y-6 slide-up">
              {/* Daily Macro Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-panel border border-panelBorder rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <FireIcon className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-xs text-textMuted font-medium">Calories</div>
                    <div className="font-bold text-textMain">{activePlan.totalCalories}</div>
                  </div>
                </div>
                <div className="bg-panel border border-panelBorder rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <ProteinIcon className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-xs text-textMuted font-medium">Protein</div>
                    <div className="font-bold text-textMain">{activePlan.totalProtein}g</div>
                  </div>
                </div>
                <div className="bg-panel border border-panelBorder rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <BoltIcon className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <div className="text-xs text-textMuted font-medium">Carbs</div>
                    <div className="font-bold text-textMain">{activePlan.totalCarbs}g</div>
                  </div>
                </div>
                <div className="bg-panel border border-panelBorder rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full border-2 border-yellow-500 opacity-80" />
                  </div>
                  <div>
                    <div className="text-xs text-textMuted font-medium">Fat</div>
                    <div className="font-bold text-textMain">{activePlan.totalFat}g</div>
                  </div>
                </div>
              </div>

              {/* Meals List */}
              <div className="space-y-4">
                {activePlan.meals.map((meal, idx) => (
                  <div key={idx} className="bg-panel border border-panelBorder rounded-2xl p-5 hover:border-primary/50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold text-primary tracking-wider uppercase mb-1">
                          {meal.type}
                        </div>
                        <h3 className="text-lg font-bold text-textMain">{meal.name}</h3>
                        <p className="text-sm text-textMuted mt-1">{meal.description}</p>
                      </div>
                      <div className="flex items-center gap-4 bg-background px-4 py-2 rounded-xl border border-panelBorder shrink-0">
                        <div className="text-center">
                          <div className="text-[10px] text-textMuted font-medium uppercase">Kcal</div>
                          <div className="font-bold text-textMain text-sm">{meal.calories}</div>
                        </div>
                        <div className="w-px h-8 bg-panelBorder"></div>
                        <div className="text-center">
                          <div className="text-[10px] text-textMuted font-medium uppercase">Pro</div>
                          <div className="font-bold text-blue-500 text-sm">{meal.protein}g</div>
                        </div>
                        <div className="w-px h-8 bg-panelBorder"></div>
                        <div className="text-center">
                          <div className="text-[10px] text-textMuted font-medium uppercase">Carb</div>
                          <div className="font-bold text-green-500 text-sm">{meal.carbs}g</div>
                        </div>
                        <div className="w-px h-8 bg-panelBorder"></div>
                        <div className="text-center">
                          <div className="text-[10px] text-textMuted font-medium uppercase">Fat</div>
                          <div className="font-bold text-yellow-500 text-sm">{meal.fat}g</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <GroceryListModal 
        isOpen={isGroceryOpen} 
        onClose={() => setIsGroceryOpen(false)} 
        list={groceryList} 
      />
    </div>
  );
};
