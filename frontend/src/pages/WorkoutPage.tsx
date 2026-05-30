import { useEffect, useState } from "react";
import { fetchProfileRequest } from "../services/profileApi";
import { fetchWorkoutPlanRequest, generateWorkoutPlanRequest } from "../services/workoutApi";
import type { UserProfile, DailyWorkoutPlan } from "../types";
import { SparklesIcon, BoltIcon, FireIcon } from "../components/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Mock routines matching Workouts.png exactly
const mockRoutines = [
  {
    id: "r1",
    title: "Morning Flow Yoga",
    subtext: "Gentle stretching & mobility",
    duration: "20 min",
    calories: "120 kcal",
    type: "Flexibility",
    typeIcon: "🤸",
    level: "Beginner",
    img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80",
    color: "#EBF2EB",
    textColor: "#7A9E7E"
  },
  {
    id: "r2",
    title: "High Intensity Burn",
    subtext: "Full body fat burning circuit",
    duration: "45 min",
    calories: "520 kcal",
    type: "HIIT",
    typeIcon: "🏃‍♂️",
    level: "Advanced",
    img: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=600&auto=format&fit=crop&q=80",
    color: "#FEF0EB",
    textColor: "#E8815A"
  },
  {
    id: "r3",
    title: "Upper Body Power",
    subtext: "Hypertrophy focused lifting",
    duration: "60 min",
    calories: "380 kcal",
    type: "Strength",
    typeIcon: "🏋️‍♂️",
    level: "Intermediate",
    img: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80",
    color: "#EBF2F8",
    textColor: "#7A9EBE"
  }
];

// Mock recent exercises timeline matching Workouts.png
const recentExercises = [
  { id: 1, name: "Bench Press", sets: "4 sets x 10 reps", stat: "85 kg", icon: "🏋️‍♂️" },
  { id: 2, name: "Treadmill Run", sets: "3.2 km • 5:15 min/km", stat: "17 min", icon: "🏃‍♂️" },
  { id: 3, name: "Plank", sets: "3 holds x 60 sec", stat: "3 min", icon: "🧘" }
];

// Mock weekly activity duration data matching Workouts.png chart heights
const mockWeeklyData = [
  { name: "M", mins: 25 },
  { name: "T", mins: 38 },
  { name: "W", mins: 0 },
  { name: "T", mins: 60 },
  { name: "F", mins: 15 },
  { name: "S", mins: 80 },
  { name: "S", mins: 45 },
];

type WorkoutPageProps = {
  onNavigate?: (path: string) => void;
};

export const WorkoutPage = ({ onNavigate }: WorkoutPageProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<DailyWorkoutPlan[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // App views state
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const [showAIPersonalTrainer, setShowAIPersonalTrainer] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

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
        setError("Failed to load workout routine data");
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
      setShowAIPersonalTrainer(true);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || "Failed to generate workout plan.");
    } finally {
      setGenerating(false);
    }
  };

  const handleLogCustom = () => {
    alert("Logging custom workout...");
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-background pb-24 px-8 pt-8 animate-pulse">
        <header className="max-w-6xl mx-auto w-full flex justify-between items-center mb-8">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-[#E2E4DC] rounded-xl" />
            <div className="h-4 w-72 bg-[#E2E4DC]/60 rounded-lg" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white border border-border rounded-full" />
            <div className="h-10 w-10 bg-white border border-border rounded-full" />
            <div className="h-10 w-10 bg-[#E2E4DC] rounded-full" />
          </div>
        </header>
        <main className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.3fr_1.0fr] gap-8">
          <div className="space-y-6">
            <div className="bg-white border border-border rounded-[24px] p-6 h-96" />
            <div className="bg-white border border-border rounded-[24px] p-6 h-64" />
          </div>
          <div className="space-y-6">
            <div className="bg-white border border-border rounded-[24px] p-6 h-72" />
            <div className="bg-white border border-border rounded-[24px] p-6 h-60" />
          </div>
        </main>
      </div>
    );
  }

  const activePlan: DailyWorkoutPlan | undefined = workoutPlan?.find(d => d.day === selectedDay);

  return (
    <div className="flex-1 min-h-screen bg-background relative overflow-y-auto pb-24 px-8 pt-8">
      {/* Header matching Workouts.png */}
      <header className="max-w-6xl mx-auto w-full flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-textHeading tracking-tight">Fitness &amp; Training</h1>
          <p className="text-textMuted text-sm mt-1">
            You've burned 450 kcal across 3 sessions this week.
          </p>
        </div>

        <div className="flex items-center gap-3 relative">
          {/* Header Action Buttons */}
          <button 
            onClick={() => onNavigate?.("/history")}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-border hover:bg-surfaceAlt text-textHeading transition-colors shadow-sm"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
          </button>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-border hover:bg-surfaceAlt text-textHeading transition-colors shadow-sm relative"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-rose-500"></span>
          </button>
          <div 
            onClick={() => onNavigate?.("/profile")}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#EBF2EB] border border-[#D4E6D5] text-[#2C3E2B] font-bold text-sm shadow-sm cursor-pointer hover:bg-[#D4E6D5] transition-colors"
          >
            AR
          </div>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white/95 backdrop-blur-md border border-border rounded-2xl shadow-xl p-4 z-50 animate-slide-up">
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
                <div className="p-2.5 rounded-xl bg-[#EBF2EB] border border-[#D4E6D5] flex gap-2 items-start">
                  <span className="text-sm">⭐</span>
                  <div>
                    <h5 className="font-bold text-[#2C3E2B] text-[10px]">7 Day Streak!</h5>
                    <p className="text-[9px] text-[#2C3E2B]/85 mt-0.5">Alex, you have maintained a 7-day food logging consistency.</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FEF0EB] border border-[#FEE2D5] flex gap-2 items-start">
                  <span className="text-sm">💧</span>
                  <div>
                    <h5 className="font-bold text-[#E8815A] text-[10px]">Hydration Target</h5>
                    <p className="text-[9px] text-[#E8815A]/85 mt-0.5">Don't forget to log 500ml water after your lunch.</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#EBF2F8] border border-border flex gap-2 items-start">
                  <span className="text-sm">🏋️‍♂️</span>
                  <div>
                    <h5 className="font-bold text-textHeading text-[10px]">Workout Logged</h5>
                    <p className="text-[9px] text-textMuted mt-0.5">3 workout sessions synchronized from Apple Health.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {error && (
        <div className="max-w-6xl mx-auto w-full mb-6 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm font-medium">
          {error}
        </div>
      )}

      {/* Main Content Grid */}
      <main className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.3fr_1.0fr] gap-8">
        
        {/* Left Column: Recommended Routines, AI Trainer, Weekly Activity */}
        <div className="space-y-8">
          
          {/* Recommended Routines */}
          <div className="space-y-4 animate-slide-up">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-textHeading">Recommended Routines</h2>
              <button 
                onClick={handleLogCustom}
                className="px-4 py-2 bg-white border border-[#E2E4DC] hover:border-primary text-textHeading rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                + Log Custom
              </button>
            </div>

            <div className="space-y-4">
              {mockRoutines.map((routine) => (
                <div 
                  key={routine.id}
                  className="bg-white border border-border rounded-3xl overflow-hidden hover:shadow-md transition-shadow p-4 flex gap-5 shadow-sm"
                >
                  <img 
                    src={routine.img} 
                    alt={routine.title}
                    className="w-40 h-28 object-cover rounded-2xl shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-textHeading text-base">{routine.title}</h3>
                        <span 
                          style={{ backgroundColor: routine.color, color: routine.textColor }}
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border border-border"
                        >
                          {routine.level}
                        </span>
                      </div>
                      <p className="text-xs text-textMuted mt-0.5">{routine.subtext}</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-bold text-textMuted mt-3">
                      <span>⏱ {routine.duration}</span>
                      <span>•</span>
                      <span>🔥 {routine.calories}</span>
                      <span>•</span>
                      <span>{routine.typeIcon} {routine.type}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Collapsible AI Personal Trainer (Click to expand if plan is ready) */}
          <section className="bg-white rounded-[24px] border border-border p-6 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-textHeading flex items-center gap-2">
                  <span>✨</span> AI Personal Trainer Plan
                </h3>
                <p className="text-xs text-textMuted mt-0.5">
                  {workoutPlan ? "Your custom 7-day routine is ready." : "Let AI build a routine for your goal."}
                </p>
              </div>

              {workoutPlan ? (
                <button
                  onClick={() => setShowAIPersonalTrainer(!showAIPersonalTrainer)}
                  className="text-xs font-bold text-[#7A9E7E] hover:text-[#5C7A60] transition-colors"
                >
                  {showAIPersonalTrainer ? "Hide Plan" : "View Plan"}
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-4 py-2 bg-[#9DB89F] hover:bg-[#7A9E7E] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  {generating ? "Creating..." : "Generate AI Plan"}
                </button>
              )}
            </div>

            {workoutPlan && showAIPersonalTrainer && (
              <div className="mt-6 pt-6 border-t border-[#F5F5F0] space-y-4">
                <div className="flex overflow-x-auto gap-1 pb-2 scrollbar-none bg-[#E2E4DC]/20 border border-border rounded-full p-1 max-w-full">
                  {workoutPlan.map((d) => (
                    <button
                      key={d.day}
                      onClick={() => setSelectedDay(d.day)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                        selectedDay === d.day
                          ? "bg-white text-textHeading shadow-sm"
                          : "text-textMuted hover:text-textHeading"
                      }`}
                    >
                      {d.day}
                    </button>
                  ))}
                </div>

                {activePlan && (
                  <div className="bg-[#F5F6F1] border border-border p-4 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-textHeading text-sm capitalize">{activePlan.focus}</h4>
                      <span className="text-xs font-bold text-textHeading bg-white px-2.5 py-1 rounded-full border border-border">
                        ⏱ {activePlan.durationMins} Mins
                      </span>
                    </div>

                    <div className="space-y-2.5 pt-2">
                      {activePlan.isRestDay ? (
                        <p className="text-xs text-textMuted italic">Active recovery day. Stretch or walk.</p>
                      ) : (
                        activePlan.exercises.map((ex, i) => (
                          <div key={i} className="flex justify-between text-xs py-1.5 border-b border-border/40 last:border-b-0">
                            <div>
                              <span className="font-bold text-textHeading block">{ex.name}</span>
                              <span className="text-[10px] text-textMuted">{ex.notes}</span>
                            </div>
                            <span className="font-semibold text-textMuted text-right shrink-0">
                              {ex.sets}s • {ex.reps} • Rest {ex.restSecs}s
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Weekly Activity Chart (Minutes) Card at bottom left */}
          <section className="bg-white rounded-[24px] border border-border p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="font-bold text-textHeading text-base">Weekly Activity (Minutes)</h3>
            </div>
            
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockWeeklyData} margin={{ top: 10, right: 5, left: -30, bottom: 0 }}>
                  <XAxis 
                    dataKey="name" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: "#888888", fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: "#888888", fontSize: 11, fontWeight: 600 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #E2E4DC" }}
                    labelStyle={{ fontWeight: "bold", color: "#2C3E2B" }}
                  />
                  <Bar dataKey="mins" fill="#C8CBBC" radius={[4, 4, 0, 0]} barSize={22}>
                    {/* Sage green highlight for Saturday peaks */}
                    {mockWeeklyData.map((entry, index) => (
                      <rect key={index} fill={entry.mins > 50 ? "#9DB89F" : "#C8CBBC"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* Right Column: Activity Summary, Recent Exercises, Hydration Widget */}
        <div className="space-y-8">
          
          {/* Activity Summary */}
          <div className="space-y-4">
            <h3 className="font-bold text-textHeading text-sm uppercase tracking-wider">Activity Summary</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Avg Heart Rate */}
              <div className="bg-white border border-[#E38F8F]/30 rounded-2xl p-4 shadow-[0_2px_12px_-3px_rgba(227,143,143,0.06)] hover:shadow-[0_4px_16px_-2px_rgba(227,143,143,0.12)] transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between h-32">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Avg Heart Rate</span>
                  <span className="w-7 h-7 rounded-full bg-[#FEF0EB] border border-[#FEE2D5] flex items-center justify-center text-xs animate-pulse">
                    💓
                  </span>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-textHeading">124 <span className="text-xs text-textMuted font-medium">bpm</span></div>
                  <span className="inline-block bg-[#FEF0EB] text-[#E8815A] text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mt-2">
                    Fat Burn
                  </span>
                </div>
              </div>

              {/* Active Time */}
              <div className="bg-white border border-[#7A9E7E]/30 rounded-2xl p-4 shadow-[0_2px_12px_-3px_rgba(122,158,126,0.06)] hover:shadow-[0_4px_16px_-2px_rgba(122,158,126,0.12)] transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between h-32">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Active Time</span>
                  <span className="w-7 h-7 rounded-full bg-[#EBF2EB] border border-[#D4E6D5] flex items-center justify-center text-xs">
                    ⚡
                  </span>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-textHeading">3.2 <span className="text-xs text-textMuted font-medium">hrs</span></div>
                  <div className="w-full bg-[#F5F5F0] h-1.5 rounded-full overflow-hidden mt-3.5">
                    <div className="bg-[#7A9E7E] h-full rounded-full" style={{ width: "80%" }} />
                  </div>
                </div>
              </div>

              {/* Volume */}
              <div className="bg-white border border-[#D4A847]/30 rounded-2xl p-4 shadow-[0_2px_12px_-3px_rgba(212,168,71,0.06)] hover:shadow-[0_4px_16px_-2px_rgba(212,168,71,0.12)] transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between h-32">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Volume</span>
                  <span className="w-7 h-7 rounded-full bg-[#FEF9EB] border border-[#FEE2D5] flex items-center justify-center text-xs">
                    🏋️‍♂️
                  </span>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-textHeading">12.4k <span className="text-xs text-textMuted font-medium">kg</span></div>
                  <span className="inline-block bg-[#FEF9EB] text-[#D4A847] text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mt-2">
                    +12% vs last wk
                  </span>
                </div>
              </div>

              {/* Recovery */}
              <div className="bg-white border border-[#7A9EBE]/30 rounded-2xl p-4 shadow-[0_2px_12px_-3px_rgba(122,158,190,0.06)] hover:shadow-[0_4px_16px_-2px_rgba(122,158,190,0.12)] transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between h-32">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Recovery</span>
                  <span className="w-7 h-7 rounded-full bg-[#EBF2F8] border border-blueLight flex items-center justify-center text-xs">
                    🔋
                  </span>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-[#7A9E7E]">Good</div>
                  <span className="inline-block bg-[#EBF2F8] text-[#7A9EBE] text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mt-2">
                    88% charged
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Exercises Card */}
          <section className="bg-white rounded-[24px] border border-border p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-textHeading text-sm">Recent Exercises</h3>
            
            <div className="space-y-4">
              {recentExercises.map((exercise) => (
                <div key={exercise.id} className="flex justify-between items-center py-2 border-b border-[#F5F5F0] last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#F5F6F1] flex items-center justify-center text-sm shadow-sm select-none">
                      {exercise.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-textHeading text-xs">{exercise.name}</h4>
                      <p className="text-[10px] text-textMuted mt-0.5">{exercise.sets}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-textHeading">{exercise.stat}</span>
                </div>
              ))}
            </div>

            <div className="text-center pt-3 border-t border-[#F5F5F0]">
              <button 
                onClick={() => alert("Full history logs...")}
                className="text-xs font-bold text-[#7A9E7E] hover:text-[#5C7A60] transition-colors"
              >
                View Full History
              </button>
            </div>
          </section>

          {/* Post-Workout Hydration Card */}
          <div className="bg-[#F5F6F1] rounded-3xl p-5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#7A9EBE] shadow-sm">
                💧
              </div>
              <div>
                <h4 className="font-bold text-textHeading text-xs">Stay Hydrated</h4>
                <p className="text-[10px] text-textMuted mt-0.5">Drink 500ml after your workout.</p>
              </div>
            </div>
            
            <button
              onClick={() => setHydrated(!hydrated)}
              className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
                hydrated 
                  ? "bg-[#7A9E7E] border-[#7A9E7E] text-white" 
                  : "bg-white border-border text-transparent hover:border-[#7A9E7E]"
              }`}
            >
              ✓
            </button>
          </div>

        </div>
      </main>

      {/* Floating Action Button matching Workouts.png */}
      <button 
        onClick={() => alert("Starting workout session...")}
        className="fixed bottom-8 right-8 flex items-center gap-1.5 px-6 py-3.5 bg-[#9DB89F] hover:bg-[#7A9E7E] text-white rounded-full font-bold shadow-lg shadow-[#9DB89F]/30 hover:scale-105 active:scale-95 transition-all z-20"
      >
        <span className="text-lg font-semibold">+</span>
        <span>Start Workout</span>
      </button>
    </div>
  );
};
