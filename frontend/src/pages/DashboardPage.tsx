import { useEffect, useState, useMemo } from "react";
import { UploadCard } from "../components/UploadCard";
import { useUploadStore } from "../store/uploadStore";
import { fetchProfileRequest, suggestMealsRequest } from "../services/profileApi";
import { fetchHistoryRequest } from "../services/historyApi";
import { SparklesIcon } from "../components/icons";
import type { UserProfile, UploadAnalysis } from "../types";

type DashboardPageProps = {
  onUploadSuccess: () => void;
};

const featureItems = [
  { label: "Food Detection", color: "#F97316" }, // primary
  { label: "Volume Estimation", color: "#3B82F6" }, // info
  { label: "Calorie Analysis", color: "#A855F7" }, // purple
  { label: "Health Advice", color: "#10B981" }, // success
];

export const DashboardPage = ({ onUploadSuccess }: DashboardPageProps) => {
  const cancelUpload = useUploadStore((state) => state.cancelUpload);
  const clearError = useUploadStore((state) => state.clearError);
  const dragActive = useUploadStore((state) => state.dragActive);
  const errorMessage = useUploadStore((state) => state.errorMessage);
  const isUploading = useUploadStore((state) => state.isUploading);
  const setDragActive = useUploadStore((state) => state.setDragActive);
  const uploadImage = useUploadStore((state) => state.uploadImage);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayHistory, setTodayHistory] = useState<UploadAnalysis[]>([]);
  const [allHistory, setAllHistory] = useState<UploadAnalysis[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  // AI Advisor State
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    
    const loadData = async () => {
      try {
        setIsLoadingStats(true);
        const [profileRes, historyRes] = await Promise.all([
          fetchProfileRequest(controller.signal).catch(() => null),
          fetchHistoryRequest({ limit: 50, signal: controller.signal }).catch(() => null)
        ]);

        if (profileRes?.data) setProfile(profileRes.data);
        if (historyRes?.data) {
          setAllHistory(historyRes.data);
          const today = new Date().toISOString().split('T')[0];
          const todaysMeals = historyRes.data.filter((item: UploadAnalysis) => item.createdAt.startsWith(today));
          setTodayHistory(todaysMeals);
        }
      } finally {
        setIsLoadingStats(false);
      }
    };
    
    void loadData();
    return () => {
      controller.abort();
      cancelUpload();
    };
  }, [cancelUpload]);

  const dailyCalories = useMemo(() => todayHistory.reduce((sum, item) => sum + item.macros.calories, 0), [todayHistory]);
  const dailyProtein = useMemo(() => todayHistory.reduce((sum, item) => sum + item.macros.protein, 0), [todayHistory]);
  
  const targetCalories = profile?.maintenanceCalories || profile?.nutritionalTargets?.calories || 2000;
  const progressPercent = Math.min(100, Math.round((dailyCalories / targetCalories) * 100));
  const remainingCalories = Math.max(0, targetCalories - dailyCalories);
  const remainingProtein = Math.max(0, 100 - dailyProtein); // assuming 100g target

  // Calculate Calendar & Streak
  const last7Days = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize today to midnight
    
    // Create a map of YYYY-MM-DD -> total calories
    const dailyTotals: Record<string, number> = {};
    allHistory.forEach(item => {
      const d = item.createdAt.split('T')[0];
      dailyTotals[d] = (dailyTotals[d] || 0) + item.macros.calories;
    });

    let currentStreak = 0;
    let streakActive = true;

    // Go backwards from today to 30 days to calculate streak
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const cals = dailyTotals[dateStr] || 0;
      // Goal hit if > 50% of target and < 110% of target
      const hitGoal = cals > (targetCalories * 0.5) && cals <= (targetCalories * 1.1);
      
      // Streak calculation
      if (streakActive) {
        if (hitGoal) currentStreak++;
        else if (i > 0) streakActive = false; // missing today doesn't break yesterday's streak yet
      }

      // We only need last 7 days for the UI array
      if (i < 7) {
        const isToday = i === 0;
        let status = 'empty';
        if (cals > 0) {
          status = hitGoal ? 'success' : 'danger';
        }
        
        days.unshift({
          dateStr,
          dayName: isToday ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
          status,
          cals
        });
      }
    }
    
    return { days, currentStreak };
  }, [allHistory, targetCalories]);

  const handleGetSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const res = await suggestMealsRequest(remainingCalories, remainingProtein);
      if (res.success) setSuggestions(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-medium text-textMuted">Dashboard</div>
          {last7Days.currentStreak > 0 && (
            <div className="flex items-center gap-1.5 bg-orange-500/20 text-orange-500 px-3 py-1 rounded-full text-xs font-bold border border-orange-500/30">
              🔥 {last7Days.currentStreak}-Day Streak!
            </div>
          )}
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-textMain mb-2">
          Food Upload &amp; Analysis Dashboard
        </h1>
        <p className="text-sm text-textMuted mb-8">
          Upload food images for AI-powered nutritional analysis and personalized health insights
        </p>

        {/* Weekly Calendar */}
        <div className="mb-6 flex items-center justify-between gap-2 overflow-x-auto pb-2">
          {last7Days.days.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center flex-shrink-0 w-12">
              <span className={`text-[10px] font-bold mb-1.5 ${day.dayName === 'Today' ? 'text-primary' : 'text-textMuted'}`}>
                {day.dayName}
              </span>
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  day.status === 'success' ? 'bg-success/20 border-success text-success' :
                  day.status === 'danger' ? 'bg-danger/20 border-danger text-danger' :
                  'bg-panel border-panelBorder text-textMuted'
                }`}
                title={`${day.cals} kcal`}
              >
                {day.status === 'success' ? '✓' : day.status === 'danger' ? '!' : '-'}
              </div>
            </div>
          ))}
        </div>

        {/* Daily Progress Widget */}
        <div className="mb-8 p-6 rounded-2xl border border-panelBorder bg-panel shadow-sm">
          <div className="flex justify-between items-end mb-3">
            <div>
              <h2 className="text-lg font-bold text-textMain">Today's Progress</h2>
              <p className="text-xs text-textMuted mt-1">Caloric intake vs your daily target</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">{dailyCalories}</span>
              <span className="text-sm font-medium text-textMuted"> / {targetCalories} kcal</span>
            </div>
          </div>
          <div className="h-4 w-full bg-background rounded-full overflow-hidden border border-panelBorder">
            <div 
              className={`h-full transition-all duration-1000 ease-out ${progressPercent > 100 ? 'bg-danger' : 'bg-primary'}`} 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-xs font-medium text-textMuted">
            <span>{todayHistory.length} meals logged today</span>
            <span>{remainingCalories} kcal remaining</span>
          </div>

          {/* AI Advisor Block */}
          <div className="mt-6 pt-6 border-t border-panelBorder">
            <button 
              onClick={handleGetSuggestions}
              disabled={isLoadingSuggestions || remainingCalories < 100}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600/10 text-purple-400 hover:bg-purple-600/20 px-4 py-3 text-sm font-bold transition-colors disabled:opacity-50"
            >
              <SparklesIcon className="h-5 w-5" /> 
              {isLoadingSuggestions ? "Consulting AI..." : "What should I eat next?"}
            </button>
            
            {suggestions.length > 0 && (
              <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-3">
                {suggestions.map((meal, idx) => (
                  <div key={idx} className="p-4 bg-background rounded-xl border border-panelBorder shadow-sm flex flex-col h-full">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="font-bold text-sm text-textMain leading-tight">{meal.name}</div>
                      <div className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded whitespace-nowrap">
                        {meal.calories} kcal
                      </div>
                    </div>
                    <div className="text-xs text-textMuted leading-relaxed flex-1 mb-3">{meal.description}</div>
                    <div className="text-xs font-semibold text-success bg-success/10 px-2 py-1 rounded w-fit">
                      {meal.protein}g protein
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mb-16">
          <UploadCard
            dragActive={dragActive}
            errorMessage={errorMessage}
            isUploading={isUploading}
            onDragChange={(active) => {
              clearError();
              setDragActive(active);
            }}
            onFileSelected={async (file, mealType) => {
              clearError();
              const success = await uploadImage(file, mealType);
              if (success) {
                onUploadSuccess();
              }
            }}
          />
        </div>

        <section className="text-center max-w-2xl mx-auto">
          <h2 className="text-xl font-bold tracking-tight text-textMain mb-4">
            Ready to Analyze Your Food?
          </h2>
          <p className="text-sm text-textMuted leading-relaxed mb-8">
            Upload an image of your meal to get started with AI-powered nutritional analysis, volume estimation, and personalized health recommendations.
          </p>

          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4">
            {featureItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm font-medium text-textMuted">{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
