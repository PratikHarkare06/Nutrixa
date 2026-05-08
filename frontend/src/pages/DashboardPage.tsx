import { useEffect, useState, useMemo } from "react";
import { UploadCard } from "../components/UploadCard";
import { useUploadStore } from "../store/uploadStore";
import { fetchProfileRequest } from "../services/profileApi";
import { fetchHistoryRequest } from "../services/historyApi";
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
  const [isLoadingStats, setIsLoadingStats] = useState(true);

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
          // Filter only today's meals
          const today = new Date().toISOString().split('T')[0];
          const todaysMeals = historyRes.data.filter(item => item.createdAt.startsWith(today));
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
  const targetCalories = profile?.maintenanceCalories || profile?.nutritionalTargets?.calories || 2000;
  const progressPercent = Math.min(100, Math.round((dailyCalories / targetCalories) * 100));

  return (
    <div className="flex-1 overflow-y-auto px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-sm font-medium text-textMuted mb-4">Dashboard</div>

        <h1 className="text-3xl font-bold tracking-tight text-textMain mb-2">
          Food Upload &amp; Analysis Dashboard
        </h1>
        <p className="text-sm text-textMuted mb-8">
          Upload food images for AI-powered nutritional analysis and personalized health insights
        </p>

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
            <span>{Math.max(0, targetCalories - dailyCalories)} kcal remaining</span>
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
