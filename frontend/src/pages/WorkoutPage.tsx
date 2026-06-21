import { useEffect, useState } from "react";
import { fetchProfileRequest } from "../services/profileApi";
import { fetchWorkoutPlanRequest, generateWorkoutPlanRequest, completeWorkoutSessionRequest } from "../services/workoutApi";
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
    textColor: "#7A9E7E",
    muscles: ["Abs", "Legs", "Back"]
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
    textColor: "#E8815A",
    muscles: ["Quads", "Abs", "Shoulders", "Chest", "Legs"]
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
    textColor: "#7A9EBE",
    muscles: ["Chest", "Shoulders", "Arms", "Back"]
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
  const [notifications, setNotifications] = useState([
    { id: 1, type: "streak", emoji: "⭐", bg: "#EBF2EB", border: "#D4E6D5", titleColor: "#2C3E2B", textColor: "#2C3E2B", title: "7 Day Streak!", text: "Alex, you have maintained a 7-day food logging consistency." },
    { id: 2, type: "water", emoji: "💧", bg: "#FEF0EB", border: "#FEE2D5", titleColor: "#E8815A", textColor: "#E8815A", title: "Hydration Target", text: "Don't forget to log 500ml water after your lunch." },
    { id: 3, type: "workout", emoji: "🏋️‍♂️", bg: "#EBF2F8", border: "#E2E4DC", titleColor: "#2C3E2B", textColor: "#888888", title: "Workout Logged", text: "3 workout sessions synchronized from Apple Health." }
  ]);

  // Companion Timer States
  const [activeWorkoutCompanion, setActiveWorkoutCompanion] = useState<DailyWorkoutPlan | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const [currentSet, setCurrentSet] = useState<number>(1);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [timerType, setTimerType] = useState<"exercise" | "rest">("exercise");
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [metronomeEnabled, setMetronomeEnabled] = useState<boolean>(true);
  
  // Dynamic stats
  const [weeklyData, setWeeklyData] = useState(mockWeeklyData);
  const [burnedCalories, setBurnedCalories] = useState(450);
  const [sessionsCount, setSessionsCount] = useState(3);

  const [workoutCompleted, setWorkoutCompleted] = useState<boolean>(false);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [hoverMuscle, setHoverMuscle] = useState<string | null>(null);
  const [isRecoveryCoachOpen, setIsRecoveryCoachOpen] = useState(false);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [hydrationML, setHydrationML] = useState(2000);
  const [recoveryCalorieBurn, setRecoveryCalorieBurn] = useState(450);
  const [applyBiometricAdjustments, setApplyBiometricAdjustments] = useState(false);

  const playMetronomeTick = (frequency: number, duration: number) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("Web Audio API error:", e);
    }
  };

  const getTempoPhaseText = (seconds: number) => {
    if (seconds === 0) return "Get Ready!";
    const phase = (seconds - 1) % 5;
    if (phase === 0 || phase === 1 || phase === 2) return "⬇️ DOWN (eccentric)";
    if (phase === 3) return "⏸️ HOLD (isometric)";
    return "⬆️ UP (concentric)";
  };

  const getTempoScale = (seconds: number) => {
    if (seconds === 0) return 1.0;
    const phase = (seconds - 1) % 5;
    if (phase === 0) return 0.9;
    if (phase === 1) return 0.8;
    if (phase === 2) return 0.7;
    if (phase === 3) return 0.7;
    if (phase === 4) return 1.15;
    return 1.0;
  };

  const handleNextSetOrExercise = () => {
    if (!activeWorkoutCompanion) return;
    const ex = activeWorkoutCompanion.exercises[currentExerciseIndex];

    if (currentSet < ex.sets) {
      const nextSetNum = currentSet + 1;
      setCurrentSet(nextSetNum);
      setTimerType("exercise");
      setTimerSeconds(0);
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`Set ${nextSetNum} of ${ex.name}.`);
        window.speechSynthesis.speak(utterance);
      }
    } else {
      if (currentExerciseIndex < activeWorkoutCompanion.exercises.length - 1) {
        const nextExIdx = currentExerciseIndex + 1;
        const nextEx = activeWorkoutCompanion.exercises[nextExIdx];
        setCurrentExerciseIndex(nextExIdx);
        setCurrentSet(1);
        setTimerType("exercise");
        setTimerSeconds(0);
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(`Starting ${nextEx.name}. Set 1 of ${nextEx.sets}.`);
          window.speechSynthesis.speak(utterance);
        }
      }
    }
  };

  const handleCompleteSet = () => {
    if (!activeWorkoutCompanion) return;
    const ex = activeWorkoutCompanion.exercises[currentExerciseIndex];
    const isLastSet = currentSet === ex.sets;
    const isLastExercise = currentExerciseIndex === activeWorkoutCompanion.exercises.length - 1;

    if (isLastSet && isLastExercise) {
      setIsTimerRunning(false);
      setWorkoutCompleted(true);
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("Workout complete! Congratulations, you did an amazing job today!");
        window.speechSynthesis.speak(utterance);
      }
      
      const duration = activeWorkoutCompanion.durationMins || 30;
      const calories = duration * 8; // average 8 kcal/min
      completeWorkoutSessionRequest(activeWorkoutCompanion.focus || "Custom Workout", duration, calories)
        .then((res) => {
          if (res.success) {
            setBurnedCalories((prev) => prev + calories);
            setSessionsCount((prev) => prev + 1);
            if (res.data.levelUp) {
              alert(`🎉 Level Up! You reached Level ${res.data.level}!`);
            }
            if (res.data.badgeUnlocked) {
              alert(`🏅 New Badge Unlocked: ${res.data.badgeUnlocked}!`);
            }
          }
        })
        .catch((err) => {
          console.error("Failed to log completed workout session:", err);
        });
    } else {
      setTimerType("rest");
      setTimerSeconds(ex.restSecs || 30);
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`Rest for ${ex.restSecs || 30} seconds.`);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Timer ticking logic
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && activeWorkoutCompanion) {
      interval = setInterval(() => {
        if (timerType === "exercise") {
          setTimerSeconds((prev) => prev + 1);
        } else {
          setTimerSeconds((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              // Run in timeout to prevent React state collision during render
              setTimeout(() => {
                handleNextSetOrExercise();
              }, 0);
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerType, activeWorkoutCompanion, currentExerciseIndex, currentSet]);

  // Audio Metronome Ticks
  useEffect(() => {
    if (isTimerRunning && activeWorkoutCompanion && timerType === "exercise" && timerSeconds > 0) {
      const phase = (timerSeconds - 1) % 5;
      let freq = 400; // default Low (eccentric phase: seconds 1, 2, 3)
      if (phase === 3) freq = 600; // Hold phase (second 4)
      if (phase === 4) freq = 1000; // Concentric phase (second 5)

      if (metronomeEnabled) {
        playMetronomeTick(freq, 0.08);
      }
    }
  }, [timerSeconds, isTimerRunning, timerType, activeWorkoutCompanion, metronomeEnabled]);

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

  const renderMusclePath = (
    muscle: string, 
    pathData: string
  ) => {
    const isSelected = selectedMuscle === muscle;
    const isHovered = hoverMuscle === muscle;
    
    let fill = "#FFFFFF";
    if (isSelected) {
      fill = "#7A9E7E"; // Sage active
    } else if (isHovered) {
      fill = "#EBF2EB"; // Sage hover
    }

    return (
      <path
        d={pathData}
        fill={fill}
        stroke="#C8CBBC"
        strokeWidth="1.5"
        className="transition-colors duration-200 cursor-pointer"
        onMouseEnter={() => setHoverMuscle(muscle)}
        onMouseLeave={() => setHoverMuscle(null)}
        onClick={() => setSelectedMuscle(selectedMuscle === muscle ? null : muscle)}
      />
    );
  };

  const startWorkoutSession = (plan: DailyWorkoutPlan) => {
    let adjustedPlan = plan;
    if (applyBiometricAdjustments) {
      const isSleepLow = sleepHours < 7.0;
      const isHydrationLow = hydrationML < 2000;
      
      adjustedPlan = {
        ...plan,
        exercises: plan.exercises.map((ex) => {
          let adjustedSets = ex.sets;
          let adjustedRest = ex.restSecs;
          
          if (isSleepLow) {
            adjustedSets = Math.max(2, ex.sets - 1);
            adjustedRest = ex.restSecs + 15;
          }
          if (isHydrationLow) {
            adjustedRest = Math.max(adjustedRest, ex.restSecs + 10);
          }
          
          return {
            ...ex,
            sets: adjustedSets,
            restSecs: adjustedRest
          };
        })
      };
    }
    
    setActiveWorkoutCompanion(adjustedPlan);
    setCurrentExerciseIndex(0);
    setCurrentSet(1);
    setTimerSeconds(0);
    setTimerType("exercise");
    setIsTimerRunning(true);
    
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const firstEx = adjustedPlan.exercises[0];
      const utterance = new SpeechSynthesisUtterance(`Starting ${firstEx.name}. Set 1 of ${firstEx.sets}.`);
      window.speechSynthesis.speak(utterance);
    }
  };

  const activePlan: DailyWorkoutPlan | undefined = workoutPlan?.find(d => d.day === selectedDay);
  const recoveryScore = Math.min(100, Math.round((sleepHours / 8.0) * 45 + (hydrationML / 3000) * 35 + (recoveryCalorieBurn / 600) * 20));

  return (
    <div className="flex-1 min-h-screen bg-background relative overflow-y-auto pb-24 px-4 sm:px-8 pt-8">
      {/* Header matching Workouts.png */}
      <header className="max-w-6xl mx-auto w-full flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-textHeading tracking-tight">Fitness &amp; Training</h1>
          <p className="text-textMuted text-sm mt-1">
            You've burned {burnedCalories} kcal across {sessionsCount} sessions this week.
          </p>
        </div>

        <div className="flex items-center gap-3 relative self-start sm:self-auto">
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
            {notifications.length > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>
          <div 
            onClick={() => onNavigate?.("/profile")}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#EBF2EB] border border-[#D4E6D5] text-[#2C3E2B] font-bold text-sm shadow-sm cursor-pointer hover:bg-[#D4E6D5] transition-colors"
          >
            AR
          </div>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white/97 backdrop-blur-md border border-border rounded-2xl shadow-xl p-4 z-50 animate-slide-up">
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
          
          {/* Interactive Muscle Map Card */}
          <section className="bg-white rounded-[24px] border border-border p-6 shadow-sm space-y-4 animate-slide-up">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-textHeading text-base">Anatomical Muscle Map</h3>
                <p className="text-xs text-textMuted mt-0.5">
                  Select a muscle group to filter workouts and target your training.
                </p>
              </div>
              {selectedMuscle && (
                <button
                  onClick={() => setSelectedMuscle(null)}
                  className="px-2.5 py-1 bg-[#FEF0EB] text-[#E8815A] hover:bg-[#FEE2D5] rounded-full text-[10px] font-bold uppercase transition-all shadow-sm animate-fade-in"
                >
                  Clear Filter ✕
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-8 py-4 bg-[#F6F8F3] rounded-[20px] border border-border/60 justify-items-center">
              {/* Front View */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-3">Front View</span>
                <svg className="w-full max-w-[130px] h-auto" viewBox="0 0 160 260">
                  {/* Static background outline / Head / Neck */}
                  <circle cx="80" cy="30" r="14" fill="#E2E4DC" stroke="#C8CBBC" strokeWidth="1.5" />
                  <rect x="76" y="44" width="8" height="8" fill="#E2E4DC" stroke="#C8CBBC" strokeWidth="1.5" />
                  <circle cx="16" cy="136" r="5" fill="#E2E4DC" stroke="#C8CBBC" strokeWidth="1.5" />
                  <circle cx="144" cy="136" r="5" fill="#E2E4DC" stroke="#C8CBBC" strokeWidth="1.5" />
                  <path d="M 46,246 H 62 L 66,252 H 42 Z" fill="#E2E4DC" stroke="#C8CBBC" strokeWidth="1.5" />
                  <path d="M 98,246 H 114 L 118,252 H 94 Z" fill="#E2E4DC" stroke="#C8CBBC" strokeWidth="1.5" />

                  {/* Muscles */}
                  {renderMusclePath("Shoulders", "M 42,52 C 34,52 32,60 32,66 C 32,74 40,76 44,76 C 44,62 42,52 42,52 Z M 118,52 C 126,52 128,60 128,66 C 128,74 120,76 116,76 C 116,62 118,52 118,52 Z")}
                  {renderMusclePath("Chest", "M 50,56 H 78 V 82 H 56 C 52,82 50,78 50,74 Z M 82,56 H 110 V 74 C 110,78 108,82 104,82 H 82 Z")}
                  {renderMusclePath("Abs", "M 54,86 H 106 V 128 C 106,132 102,136 98,136 H 62 C 58,136 54,132 54,128 Z")}
                  {renderMusclePath("Arms", "M 24,70 V 126 C 24,130 21,133 18,133 C 15,133 12,130 12,126 V 70 C 12,66 15,63 18,63 C 21,63 24,66 24,70 Z M 148,70 V 126 C 148,130 145,133 142,133 C 139,133 136,130 136,126 V 70 C 136,66 139,63 142,63 C 145,63 148,66 148,70 Z")}
                  {renderMusclePath("Quads", "M 46,140 H 78 V 200 H 50 C 47,200 46,197 46,194 Z M 82,140 H 114 V 194 C 114,197 113,200 110,200 H 82 Z")}
                  {renderMusclePath("Legs", "M 50,204 H 74 V 244 H 56 C 52,244 50,240 50,236 Z M 86,204 H 110 V 236 C 110,240 108,244 104,244 H 86 Z")}
                </svg>
              </div>

              {/* Back View */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-3">Back View</span>
                <svg className="w-full max-w-[130px] h-auto" viewBox="0 0 160 260">
                  {/* Static background outline / Head / Neck */}
                  <circle cx="80" cy="30" r="14" fill="#E2E4DC" stroke="#C8CBBC" strokeWidth="1.5" />
                  <rect x="76" y="44" width="8" height="8" fill="#E2E4DC" stroke="#C8CBBC" strokeWidth="1.5" />
                  <circle cx="16" cy="136" r="5" fill="#E2E4DC" stroke="#C8CBBC" strokeWidth="1.5" />
                  <circle cx="144" cy="136" r="5" fill="#E2E4DC" stroke="#C8CBBC" strokeWidth="1.5" />
                  <path d="M 46,246 H 62 L 66,252 H 42 Z" fill="#E2E4DC" stroke="#C8CBBC" strokeWidth="1.5" />
                  <path d="M 98,246 H 114 L 118,252 H 94 Z" fill="#E2E4DC" stroke="#C8CBBC" strokeWidth="1.5" />

                  {/* Muscles */}
                  {renderMusclePath("Shoulders", "M 42,52 C 34,52 32,60 32,66 C 32,74 40,76 44,76 C 44,62 42,52 42,52 Z M 118,52 C 126,52 128,60 128,66 C 128,74 120,76 116,76 C 116,62 118,52 118,52 Z")}
                  {renderMusclePath("Back", "M 46,56 H 114 L 98,128 H 62 Z")}
                  {renderMusclePath("Arms", "M 24,70 V 126 C 24,130 21,133 18,133 C 15,133 12,130 12,126 V 70 C 12,66 15,63 18,63 C 21,63 24,66 24,70 Z M 148,70 V 126 C 148,130 145,133 142,133 C 139,133 136,130 136,126 V 70 C 136,66 139,63 142,63 C 145,63 148,66 148,70 Z")}
                  {renderMusclePath("Glutes", "M 46,132 H 114 V 148 C 114,154 108,156 102,156 H 58 C 52,156 46,154 46,148 Z")}
                  {renderMusclePath("Legs", "M 46,160 H 78 V 244 H 50 C 47,244 46,240 46,236 Z M 82,160 H 114 V 244 H 110 C 110,240 108,244 104,244 H 82 Z")}
                </svg>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 justify-center">
              {["Chest", "Shoulders", "Abs", "Arms", "Quads", "Back", "Glutes", "Legs"].map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMuscle(selectedMuscle === m ? null : m)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    selectedMuscle === m
                      ? "bg-[#9DB89F] text-white border-[#9DB89F]"
                      : "bg-white text-textMuted border-border hover:border-primary hover:text-textHeading"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </section>

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
              {(selectedMuscle ? mockRoutines.filter(r => r.muscles?.includes(selectedMuscle)) : mockRoutines).map((routine) => (
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
                        <>
                          {activePlan.exercises.map((ex, i) => (
                            <div key={i} className="flex justify-between text-xs py-1.5 border-b border-border/40 last:border-b-0">
                              <div>
                                <span className="font-bold text-textHeading block">{ex.name}</span>
                                <span className="text-[10px] text-textMuted">{ex.notes}</span>
                              </div>
                              <span className="font-semibold text-textMuted text-right shrink-0">
                                {ex.sets} sets • {ex.reps} • {ex.restSecs}s rest
                              </span>
                            </div>
                          ))}
                          <button
                            onClick={() => startWorkoutSession(activePlan)}
                            className="w-full py-2.5 mt-4 bg-[#7A9E7E] hover:bg-[#5C7A60] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                          >
                            <span>▶</span> Start Workout
                          </button>
                        </>
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
                <BarChart data={weeklyData} margin={{ top: 10, right: 5, left: -30, bottom: 0 }}>
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
                    {weeklyData.map((entry, index) => (
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
              <div 
                onClick={() => setIsRecoveryCoachOpen(true)}
                className="bg-white border border-[#7A9EBE]/30 rounded-2xl p-4 shadow-[0_2px_12px_-3px_rgba(122,158,190,0.06)] hover:shadow-[0_4px_16px_-2px_rgba(122,158,190,0.12)] transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between h-32 cursor-pointer group"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider group-hover:text-primary transition-colors">Recovery</span>
                  <span className="w-7 h-7 rounded-full bg-[#EBF2F8] border border-blueLight flex items-center justify-center text-xs">
                    🔋
                  </span>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-[#7A9E7E]">
                    {recoveryScore >= 75 ? "Excellent" : recoveryScore >= 50 ? "Good" : "Needs Rest"}
                  </div>
                  <span className="inline-block bg-[#EBF2F8] text-[#7A9EBE] text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mt-2">
                    {recoveryScore}% charged
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
        onClick={() => {
          if (activePlan) {
            startWorkoutSession(activePlan);
          } else {
            alert("Please generate or view your AI Workout Plan first!");
          }
        }}
        className="fixed bottom-8 right-8 flex items-center gap-1.5 px-6 py-3.5 bg-[#9DB89F] hover:bg-[#7A9E7E] text-white rounded-full font-bold shadow-lg shadow-[#9DB89F]/30 hover:scale-105 active:scale-95 transition-all z-20"
      >
        <span className="text-lg font-semibold">+</span>
        <span>Start Workout</span>
      </button>

      {/* Interactive Workout Companion Modal */}
      {activeWorkoutCompanion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F6F8F3]/98 backdrop-blur-md overflow-y-auto">
          <div className="max-w-2xl w-full flex flex-col items-center text-center space-y-8 p-6 md:p-12 relative bg-white border border-border rounded-[32px] shadow-2xl">
            
            {/* Metronome Toggle Button */}
            <button
              onClick={() => setMetronomeEnabled(!metronomeEnabled)}
              className="absolute top-6 left-6 text-xs font-bold text-textMuted hover:text-[#7A9E7E] transition-colors border border-border bg-white px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 z-10"
            >
              <span>{metronomeEnabled ? "🔊" : "🔇"}</span>
              <span>Metronome {metronomeEnabled ? "On" : "Off"}</span>
            </button>

            {/* Close / Quit button */}
            <button
              onClick={() => {
                if (confirm("Are you sure you want to quit this workout session? Your progress won't be saved.")) {
                  setActiveWorkoutCompanion(null);
                  setIsTimerRunning(false);
                  setWorkoutCompleted(false);
                  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
                }
              }}
              className="absolute top-6 right-6 text-xs font-bold text-textMuted hover:text-rose-500 transition-colors border border-border bg-white px-3 py-1.5 rounded-full shadow-sm z-10"
            >
              Quit Session
            </button>

            {!workoutCompleted ? (
              <>
                {/* Active Session Exercise Info */}
                <div className="space-y-2 mt-4">
                  <span className={`px-3 py-1 border rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    timerType === "exercise" 
                      ? "bg-[#EBF2EB] text-[#7A9E7E] border-[#D4E6D5]" 
                      : "bg-[#FEF9EB] text-[#D4A847] border-[#F5E6C4]"
                  }`}>
                    {timerType === "exercise" ? "Active Set" : "Rest Period"}
                  </span>
                  
                  {timerType === "exercise" ? (
                    <>
                      <h2 className="text-3xl font-extrabold text-textHeading capitalize mt-2">
                        {activeWorkoutCompanion.exercises[currentExerciseIndex].name}
                      </h2>
                      <p className="text-xs text-textMuted max-w-md mx-auto mt-1">
                        {activeWorkoutCompanion.exercises[currentExerciseIndex].notes}
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-3xl font-extrabold text-[#D4A847] mt-2">
                        Take a Rest!
                      </h2>
                      <p className="text-xs text-textMuted max-w-md mx-auto mt-1 font-semibold">
                        Next: {activeWorkoutCompanion.exercises[currentSet === activeWorkoutCompanion.exercises[currentExerciseIndex].sets ? Math.min(currentExerciseIndex + 1, activeWorkoutCompanion.exercises.length - 1) : currentExerciseIndex].name}
                      </p>
                    </>
                  )}
                </div>

                {/* Circular Timer UI */}
                <div className="relative w-64 h-64 flex flex-col items-center justify-center bg-[#F6F8F3]/50 border border-border rounded-full shadow-inner">
                  {/* Pulsating Outer Halo Ring */}
                  {timerType === "exercise" && isTimerRunning && (
                    <div 
                      className="absolute -inset-3 rounded-full bg-[#7A9E7E]/5 border border-[#7A9E7E]/10 transition-all"
                      style={{
                        transform: `scale(${1 + (getTempoScale(timerSeconds) - 1) * 0.4})`,
                        transition: `transform ${((timerSeconds - 1) % 5) === 4 ? "0.5s" : "1s"} ease-in-out`
                      }}
                    />
                  )}

                  <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle
                      cx="128"
                      cy="128"
                      r="112"
                      stroke="#E2E4DC"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="128"
                      cy="128"
                      r="112"
                      stroke={timerType === "exercise" ? "#7A9E7E" : "#D4A847"}
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 112}
                      strokeDashoffset={
                        timerType === "exercise"
                          ? 0
                          : (2 * Math.PI * 112) * (1 - (timerSeconds / (activeWorkoutCompanion.exercises[currentExerciseIndex].restSecs || 30)))
                      }
                      className="transition-all duration-1000"
                    />
                  </svg>

                  {/* Timer display */}
                  <div className="z-10 text-center flex flex-col items-center">
                    {/* Animated Dumbbell/Barbell Illustration */}
                    {timerType === "exercise" && (
                      <div 
                        className="flex justify-center mb-1"
                        style={{
                          transform: `scale(${getTempoScale(timerSeconds)})`,
                          transition: `transform ${((timerSeconds - 1) % 5) === 4 ? "0.5s" : "1s"} ease-in-out`
                        }}
                      >
                        <svg className="w-10 h-10 text-[#7A9E7E]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5h1.5m15 0H21m-15-3v6m12-6v6M6 10.5h12M4.5 7.5h3v6h-3v-6zm12 0h3v6h-3v-6z" />
                        </svg>
                      </div>
                    )}
                    <span className="text-5xl font-black text-textHeading font-mono tracking-tight">
                      {timerType === "exercise"
                        ? `${Math.floor(timerSeconds / 60)}:${(timerSeconds % 60).toString().padStart(2, "0")}`
                        : `${timerSeconds}s`}
                    </span>
                    <span className="block text-[10px] font-bold text-textMuted uppercase mt-1 tracking-wider">
                      {timerType === "exercise" ? "Elapsed Time" : "Seconds Left"}
                    </span>
                  </div>
                </div>

                {/* Tempo Phase Indicator */}
                {timerType === "exercise" && (
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider block mb-1">Lift Rhythm</span>
                    <span className={`inline-block text-xs font-bold px-4 py-1.5 rounded-full border transition-all ${
                      timerSeconds === 0 
                        ? "bg-[#EBF2EB] text-[#7A9E7E] border-[#D4E6D5]"
                        : ((timerSeconds - 1) % 5) <= 2
                        ? "bg-[#FEF0EB] text-[#E8815A] border-[#FEE2D5]"
                        : ((timerSeconds - 1) % 5) === 3
                        ? "bg-[#FEF9EB] text-[#D4A847] border-[#F5E6C4]"
                        : "bg-[#EBF2EB] text-[#7A9E7E] border-[#D4E6D5]"
                    }`}>
                      {getTempoPhaseText(timerSeconds)}
                    </span>
                  </div>
                )}

                {/* Set indicators */}
                <div className="space-y-2">
                  <div className="text-sm font-extrabold text-textHeading">
                    Set {currentSet} of {activeWorkoutCompanion.exercises[currentExerciseIndex].sets}
                  </div>
                  <div className="flex gap-2.5 justify-center">
                    {Array.from({ length: activeWorkoutCompanion.exercises[currentExerciseIndex].sets }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-3 h-3 rounded-full border transition-all ${
                          idx + 1 < currentSet
                            ? "bg-[#7A9E7E] border-[#7A9E7E]"
                            : idx + 1 === currentSet && timerType === "exercise"
                            ? "bg-[#EBF2EB] border-[#7A9E7E] scale-110"
                            : "bg-white border-border"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex gap-4 w-full max-w-sm pt-4">
                  {timerType === "exercise" ? (
                    <>
                      <button
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                        className={`flex-1 py-3.5 rounded-2xl text-xs font-bold transition-all shadow-sm ${
                          isTimerRunning
                            ? "bg-[#E2E4DC] hover:bg-[#D4D6CC] text-textHeading"
                            : "bg-[#7A9E7E] hover:bg-[#5C7A60] text-white"
                        }`}
                      >
                        {isTimerRunning ? "Pause Timer" : "Resume Timer"}
                      </button>
                      <button
                        onClick={handleCompleteSet}
                        className="flex-1 py-3.5 bg-[#9DB89F] hover:bg-[#7A9E7E] text-white rounded-2xl text-xs font-bold transition-all shadow-sm"
                      >
                        Complete Set ✓
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        handleNextSetOrExercise();
                      }}
                      className="w-full py-3.5 bg-[#D4A847] hover:bg-[#B38D36] text-white rounded-2xl text-xs font-bold transition-all shadow-sm"
                    >
                      Skip Rest Interval ▶
                    </button>
                  )}
                </div>
              </>
            ) : (
              // Workout Completed Summary Screen
              <div className="space-y-6 py-6 w-full max-w-md">
                <span className="text-6xl block animate-bounce">🏆</span>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-textHeading">Workout Completed!</h2>
                  <p className="text-xs text-textMuted leading-relaxed max-w-sm mx-auto">
                    Outstanding job, Alex! Today's exercises have been synchronized and successfully logged.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-[#F5F6F1] border border-border p-5 rounded-3xl text-center">
                  <div>
                    <span className="block text-2xl font-extrabold text-textHeading">
                      {activeWorkoutCompanion.durationMins}m
                    </span>
                    <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider">
                      Total Time
                    </span>
                  </div>
                  <div>
                    <span className="block text-2xl font-extrabold text-[#E8815A]">
                      {activeWorkoutCompanion.exercises.reduce((sum) => sum + 100, 0)} kcal
                    </span>
                    <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider">
                      Est. Burned
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const duration = activeWorkoutCompanion.durationMins || 30;
                    const calories = activeWorkoutCompanion.exercises.reduce((sum) => sum + 100, 0);

                    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                    const dayIndex = dayNames.indexOf(selectedDay);
                    if (dayIndex !== -1) {
                      setWeeklyData((prev) =>
                        prev.map((item, idx) => {
                          if (idx === dayIndex) {
                            return { ...item, mins: item.mins + duration };
                          }
                          return item;
                        })
                      );
                    }

                    setBurnedCalories((prev) => prev + calories);
                    setSessionsCount((prev) => prev + 1);

                    // Clear state
                    setActiveWorkoutCompanion(null);
                    setWorkoutCompleted(false);
                    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
                  }}
                  className="w-full py-4 bg-[#7A9E7E] hover:bg-[#5C7A60] text-white rounded-2xl text-xs font-bold transition-all shadow-md mt-4"
                >
                  Log Workout & Complete
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Biometric Synergy & Recovery Coach Modal */}
      {isRecoveryCoachOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F6F8F3]/90 backdrop-blur-md overflow-y-auto">
          <div className="max-w-md w-full bg-white border border-border rounded-[32px] shadow-2xl p-8 relative flex flex-col space-y-6 animate-scale-in">
            {/* Close Trigger */}
            <button
              onClick={() => setIsRecoveryCoachOpen(false)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full border border-border bg-white flex items-center justify-center text-textMuted hover:text-textHeading hover:bg-[#F6F8F3] transition-all"
            >
              ✕
            </button>

            {/* Header */}
            <div className="text-center">
              <span className="text-4xl block mb-2">🧠</span>
              <h3 className="text-xl font-bold text-textHeading">Biometric Recovery Coach</h3>
              <p className="text-xs text-textMuted mt-1">
                Refine today's metrics to gauge muscular readiness and customize timer constraints.
              </p>
            </div>

            {/* Gauge Display */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 120 120">
                  {/* Base Track */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#EBF2EB"
                    strokeWidth="10"
                  />
                  {/* Progress Arc */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke={
                      recoveryScore >= 75
                        ? "#7A9E7E"
                        : recoveryScore >= 50
                        ? "#D4A847"
                        : "#E38F8F"
                    }
                    strokeWidth="10"
                    strokeDasharray="314.15"
                    strokeDashoffset={314.15 - (314.15 * recoveryScore) / 100}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    className="transition-all duration-300"
                  />
                </svg>
                {/* Center score */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-textHeading">{recoveryScore}%</span>
                  <span className="text-[9px] font-bold text-textMuted uppercase tracking-wider">
                    {recoveryScore >= 75 ? "Ready" : recoveryScore >= 50 ? "Good" : "Fatigued"}
                  </span>
                </div>
              </div>
            </div>

            {/* Metric Sliders */}
            <div className="space-y-4 bg-[#F9FAF8] border border-border p-5 rounded-2xl">
              {/* Sleep slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-textHeading">💤 Sleep Duration</span>
                  <span className="font-extrabold text-[#7A9EBE]">{sleepHours} hrs</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="10"
                  step="0.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#E2E4DC] rounded-lg appearance-none cursor-pointer accent-[#7A9EBE]"
                />
              </div>

              {/* Hydration slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-textHeading">💧 Hydration Level</span>
                  <span className="font-extrabold text-[#7A9EBE]">{hydrationML} ml</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="3000"
                  step="250"
                  value={hydrationML}
                  onChange={(e) => setHydrationML(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-[#E2E4DC] rounded-lg appearance-none cursor-pointer accent-[#7A9EBE]"
                />
              </div>

              {/* Active Burn slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-textHeading">🔥 Today's Calorie Burn</span>
                  <span className="font-extrabold text-[#E8815A]">{recoveryCalorieBurn} kcal</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="50"
                  value={recoveryCalorieBurn}
                  onChange={(e) => setRecoveryCalorieBurn(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-[#E2E4DC] rounded-lg appearance-none cursor-pointer accent-[#E8815A]"
                />
              </div>
            </div>

            {/* Contextual Advice */}
            <div
              className={`p-4 rounded-2xl border text-xs leading-relaxed font-semibold transition-all ${
                recoveryScore >= 75
                  ? "bg-[#EBF2EB] border-[#7A9E7E]/30 text-[#2C3E2B]"
                  : recoveryScore >= 50
                  ? "bg-[#FEF9EB] border-[#D4A847]/30 text-[#61450C]"
                  : "bg-[#FEF0EB] border-[#E38F8F]/30 text-[#8F3B20]"
              }`}
            >
              {sleepHours < 7.0 && (
                <p className="mb-1.5">
                  ⚠️ <strong>Sleep Deficit:</strong> Muscular fibers are under-recovered. Companion sessions will automatically increase rest times by 15s and reduce sets by 1.
                </p>
              )}
              {hydrationML < 2000 && (
                <p className="mb-1.5">
                  ⚠️ <strong>Dehydration Alert:</strong> Low blood viscosity. Consume 500ml water before workout. Companion rest times will increase by 10s.
                </p>
              )}
              {sleepHours >= 7.0 && hydrationML >= 2000 && (
                <p>
                  🚀 <strong>Optimum Readiness:</strong> Sleep and hydration are in peak synergy. Cleared for maximal effort and intensity.
                </p>
              )}
            </div>

            {/* Tuning Toggle Switch */}
            <label className="flex items-center justify-between p-4 bg-[#F6F8F3] border border-border/80 rounded-2xl cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-textHeading block">Sync Companion Adjustments</span>
                <span className="text-[10px] text-textMuted">Tweak companion sets &amp; rest intervals dynamically</span>
              </div>
              <input
                type="checkbox"
                checked={applyBiometricAdjustments}
                onChange={(e) => setApplyBiometricAdjustments(e.target.checked)}
                className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary accent-[#7A9E7E]"
              />
            </label>

            {/* Footer Buttons */}
            <div className="flex gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => setIsRecoveryCoachOpen(false)}
                className="flex-1 py-3 bg-white hover:bg-[#F6F8F3] text-textHeading border border-border rounded-xl text-xs font-bold transition-all"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setApplyBiometricAdjustments(true);
                  setIsRecoveryCoachOpen(false);
                  alert(`Biometric recommendations synced successfully! Companion timer is now optimized for ${recoveryScore}% recovery readiness.`);
                }}
                className="flex-1 py-3 bg-[#7A9E7E] hover:bg-[#5C7A60] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Apply Adjustments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
