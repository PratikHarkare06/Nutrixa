import { useEffect, useState } from "react";
import { WaterIcon, SparklesIcon } from "./icons";
import { fetchDailyWaterRequest, addWaterRequest } from "../services/historyApi";
import { fetchProfileRequest } from "../services/profileApi";

export const HydrationWidget = () => {
  const [waterIntake, setWaterIntake] = useState(0);
  const [waterGoal, setWaterGoal] = useState(2500);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [waterRes, profileRes] = await Promise.all([
          fetchDailyWaterRequest(),
          fetchProfileRequest(),
        ]);
        setWaterIntake(waterRes.data.water_intake_ml);
        if (profileRes.data.waterGoalMl) {
          setWaterGoal(profileRes.data.waterGoalMl);
        }
      } catch (error) {
        console.error("Failed to load water data", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAddWater = async (amount: number) => {
    if (isAdding) return;
    setIsAdding(true);
    
    // Optimistic update
    setWaterIntake(prev => prev + amount);
    
    try {
      const res = await addWaterRequest(amount);
      setWaterIntake(res.data.water_intake_ml);
    } catch (error) {
      // Revert if failed
      setWaterIntake(prev => prev - amount);
      console.error("Failed to add water", error);
    } finally {
      setIsAdding(false);
    }
  };

  const percentage = Math.min(Math.round((waterIntake / waterGoal) * 100), 100);
  const isGoalReached = waterIntake >= waterGoal;

  return (
    <div className="bg-panel border border-panelBorder rounded-3xl p-6 flex flex-col justify-between h-full relative overflow-hidden group">
      {/* Background Water Fill Effect */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-blue-500/10 transition-all duration-1000 ease-out"
        style={{ height: `${percentage}%` }}
      />
      
      {isGoalReached && (
        <div className="absolute top-0 right-0 p-4 opacity-50 text-blue-500 animate-pulse">
          <SparklesIcon className="w-16 h-16" />
        </div>
      )}

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-500/20 p-2 rounded-xl text-blue-500">
            <WaterIcon className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-textMain text-lg">Hydration</h3>
        </div>

        <div className="flex items-end gap-2 mb-2">
          <span className="text-4xl font-black tracking-tight text-textMain">
            {isLoading ? "---" : waterIntake}
          </span>
          <span className="text-textMuted font-medium mb-1">/ {waterGoal} ml</span>
        </div>
        
        <div className="w-full bg-background rounded-full h-2.5 mb-8 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${isGoalReached ? "bg-green-500" : "bg-blue-500"}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleAddWater(250)}
            disabled={isAdding}
            className="flex-1 py-3 px-4 bg-background border border-panelBorder rounded-xl hover:border-blue-500 hover:bg-blue-500/5 text-sm font-bold text-textMain transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            +250ml
            <span className="text-xl">💧</span>
          </button>
          <button
            onClick={() => handleAddWater(500)}
            disabled={isAdding}
            className="flex-1 py-3 px-4 bg-background border border-panelBorder rounded-xl hover:border-blue-500 hover:bg-blue-500/5 text-sm font-bold text-textMain transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            +500ml
            <span className="text-xl">🥤</span>
          </button>
        </div>
      </div>
    </div>
  );
};
