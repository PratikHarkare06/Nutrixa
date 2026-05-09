import { useEffect, useState } from "react";
import { fetchProfileRequest } from "../services/profileApi";
import { fetchWorkoutPlanRequest, generateWorkoutPlanRequest } from "../services/workoutApi";
import type { UserProfile, DailyWorkoutPlan } from "../types";
import { SparklesIcon, CalendarIcon, BoltIcon, FireIcon } from "../components/icons";

export const WorkoutPage = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<DailyWorkoutPlan[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("Monday");

  useEffect(() => {
    const loadData = async () => {
      try {
        const profileRes = await fetchProfileRequest();
        if (profileRes.success) setProfile(profileRes.data);
        
        const workoutRes = await fetchWorkoutPlanRequest();
        if (workoutRes.success && workoutRes.data) {
          setWorkoutPlan(workoutRes.data);
          if (workoutRes.data.length > 0) {
            setSelectedDay(workoutRes.data[0].day);
          }
        }
      } catch (err) {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await generateWorkoutPlanRequest();
      setWorkoutPlan(res.data);
      if (res.data && res.data.length > 0) {
        setSelectedDay(res.data[0].day);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || "Failed to generate workout plan.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !workoutPlan) {
    return (
      <div className="p-8">
        <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-xl">
          {error}
        </div>
      </div>
    );
  }

  const activePlan: DailyWorkoutPlan | undefined = workoutPlan?.find(d => d.day === selectedDay);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-textMain tracking-tight">AI Workout Plan</h1>
          <p className="text-textMuted text-sm mt-1">
            Personalized fitness routine optimized for {profile?.primaryGoal || "your goals"}.
          </p>
        </div>
        {workoutPlan && (
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
            Regenerate Routine
          </button>
        )}
      </div>

      {!workoutPlan ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-panel border border-panelBorder rounded-2xl">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
            <span className="text-3xl">🏋️‍♂️</span>
          </div>
          <h2 className="text-xl font-bold text-textMain mb-2">No Workout Plan Yet</h2>
          <p className="text-textMuted max-w-md mb-8">
            Let our AI Personal Trainer build a complete 7-day fitness routine perfectly optimized for your {profile?.primaryGoal} journey.
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
                Generate My Workout Plan
              </>
            )}
          </button>
          {error && <p className="text-danger mt-4 text-sm">{error}</p>}
        </div>
      ) : (
        <>
          {/* Day Tabs */}
          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
            {workoutPlan.map((dayPlan) => (
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
              {/* Daily Summary */}
              <div className="bg-panel border border-panelBorder rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-textMain flex items-center gap-2">
                    {activePlan.isRestDay ? "🧘 Rest & Recovery" : "🔥 Workout Focus"}
                  </h2>
                  <div className="flex items-center gap-2 bg-background px-3 py-1 rounded-full border border-panelBorder">
                    <BoltIcon className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-bold text-textMain">{activePlan.durationMins} mins</span>
                  </div>
                </div>
                <p className="text-primary font-medium">{activePlan.focus}</p>
              </div>

              {/* Exercises List */}
              <div className="space-y-4">
                {activePlan.exercises.map((exercise, idx) => (
                  <div key={idx} className={`bg-panel border border-panelBorder rounded-2xl p-5 transition-colors ${activePlan.isRestDay ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-primary'}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-textMain">{exercise.name}</h3>
                        {exercise.notes && <p className="text-sm text-textMuted mt-1">{exercise.notes}</p>}
                      </div>
                      
                      {!activePlan.isRestDay && (
                        <div className="flex items-center gap-4 bg-background px-4 py-2 rounded-xl border border-panelBorder shrink-0">
                          <div className="text-center">
                            <div className="text-[10px] text-textMuted font-medium uppercase">Sets</div>
                            <div className="font-bold text-textMain text-sm">{exercise.sets}</div>
                          </div>
                          <div className="w-px h-8 bg-panelBorder"></div>
                          <div className="text-center">
                            <div className="text-[10px] text-textMuted font-medium uppercase">Reps</div>
                            <div className="font-bold text-primary text-sm">{exercise.reps}</div>
                          </div>
                          <div className="w-px h-8 bg-panelBorder"></div>
                          <div className="text-center">
                            <div className="text-[10px] text-textMuted font-medium uppercase">Rest</div>
                            <div className="font-bold text-textMain text-sm">{exercise.restSecs}s</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
