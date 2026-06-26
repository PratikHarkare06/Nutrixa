import { useEffect, useState, useRef } from "react";
import { UploadCard } from "../components/UploadCard";
import { useUploadStore } from "../store/uploadStore";
import { Area, AreaChart, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { SearchIcon, FireIcon, WaterIcon, CameraIcon, SpinnerIcon, CloseIcon } from "../components/icons";
import { BarcodeScanner } from "../components/BarcodeScanner";
import { fetchHistoryRequest } from "../services/historyApi";

type DashboardPageProps = {
  onUploadSuccess: () => void;
  onNavigate?: (path: string) => void;
};

// Mock data for calorie trend chart
const calorieTrendData = [
  { day: "M", calories: 1100 },
  { day: "T", calories: 1250 },
  { day: "W", calories: 1050 },
  { day: "T", calories: 1180 },
  { day: "F", calories: 1350 },
  { day: "S", calories: 1200 },
  { day: "S", calories: 1240 },
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
  const cancelUpload = useUploadStore((state) => state.cancelUpload);
  const clearError = useUploadStore((state) => state.clearError);
  const dragActive = useUploadStore((state) => state.dragActive);
  const errorMessage = useUploadStore((state) => state.errorMessage);
  const isUploading = useUploadStore((state) => state.isUploading);
  const setDragActive = useUploadStore((state) => state.setDragActive);
  const uploadImage = useUploadStore((state) => state.uploadImage);
  const uploadVoiceLog = useUploadStore((state) => state.uploadVoiceLog);
  const scanBarcode = useUploadStore((state) => state.scanBarcode);
  const progressMessage = useUploadStore((state) => state.progressMessage);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [hydrationML, setHydrationML] = useState(1800); // 1.8L
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: "streak", emoji: "⭐", bg: "#EBF2EB", border: "#D4E6D5", titleColor: "#2C3E2B", textColor: "#2C3E2B", title: "7 Day Streak!", text: "Alex, you have maintained a 7-day food logging consistency." },
    { id: 2, type: "water", emoji: "💧", bg: "#FEF0EB", border: "#FEE2D5", titleColor: "#E8815A", textColor: "#E8815A", title: "Hydration Target", text: "Don't forget to log 500ml water after your lunch." },
    { id: 3, type: "workout", emoji: "🏋️‍♂️", bg: "#EBF2F8", border: "#E2E4DC", titleColor: "#2C3E2B", textColor: "#888888", title: "Workout Logged", text: "3 workout sessions synchronized from Apple Health." }
  ]);

  // Daily AI Macro Advisor state
  const [todayMacros, setTodayMacros] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [macroAdvice, setMacroAdvice] = useState("");

  // Goals (approximate defaults matching Nutrixa targets)
  const GOALS = { calories: 1900, protein: 120, carbs: 200, fat: 60 };

  // Voice & Barcode Logging States
  const [loggingMode, setLoggingMode] = useState<"image" | "voice" | "barcode">("image");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState("");

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      cancelUpload();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [cancelUpload]);

  // Fetch today's meal logs to build the AI Macro Advisor card
  useEffect(() => {
    const controller = new AbortController();
    const loadTodayMacros = async () => {
      try {
        const res = await fetchHistoryRequest({ limit: 20, page: 1, sort: "desc", signal: controller.signal });
        const today = new Date().toDateString();
        const todayEntries = (res.data || []).filter((e: any) => new Date(e.createdAt).toDateString() === today);
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

        // Generate adaptive advice
        const pctProt = (totals.protein / 120) * 100;
        const pctCarbs = (totals.carbs / 200) * 100;
        const pctFat = (totals.fat / 60) * 100;
        const pctCal = (totals.calories / 1900) * 100;

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
          advice = `You've consumed ${Math.round(totals.calories)} kcal out of your 1,900 kcal goal. Don't skip meals — your body needs consistent fuel to maintain metabolism.`;
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

  const startRecording = () => {
    clearError();
    setSpeechError("");
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError("Speech recognition is not supported in this browser. Please use Chrome or Safari, or type your meal description manually.");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event: any) => {
        const currentTranscript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join(" ");
        setVoiceTranscript(currentTranscript);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === "not-allowed") {
          setSpeechError("Microphone permission denied. Please allow microphone access or type your meal manually.");
        } else {
          setSpeechError(`Error during speech recognition: ${event.error}. Please type your meal manually.`);
        }
        setIsRecording(false);
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      console.error(err);
      setSpeechError("Could not start speech recognition. Please type your meal manually.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
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
    setIsUploadModalOpen(false);
  };

  // Handle successful scan
  const handleFileSelected = async (file: File | null) => {
    clearError();
    const success = await uploadImage(file, "auto");
    if (success) {
      setIsUploadModalOpen(false);
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

  const handleAddWater = (amount: number) => {
    setHydrationML((prev) => Math.min(3000, prev + amount));
  };

  const handleSubtractWater = () => {
    setHydrationML((prev) => Math.max(0, prev - 250));
  };

  const hydrationPercent = Math.min(100, Math.round((hydrationML / 3000) * 100));

  return (
    <div className="flex-1 min-h-screen bg-background relative overflow-y-auto pb-24 animate-fade-in">
      {/* Top Header */}
      <header className="px-4 sm:px-8 pt-8 pb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between max-w-6xl mx-auto w-full">
        <div>
          <h1 className="text-3xl font-bold text-textHeading tracking-tight">Welcome back, Alex</h1>
          <p className="text-textMuted text-sm mt-1">You've reached 85% of your protein goal today.</p>
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
          <div 
            onClick={() => onNavigate?.("/profile")}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#EBF2EB] border border-[#D4E6D5] text-[#2C3E2B] font-bold text-sm shadow-sm cursor-pointer hover:bg-[#D4E6D5] transition-colors"
          >
            AR
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
              {/* Meal Card 1 */}
              <div className="bg-white border border-border rounded-2xl overflow-hidden card-hover transition-all">
                <img 
                  src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80" 
                  alt="Quinoa Power Bowl" 
                  className="w-full h-40 object-cover"
                />
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-textHeading text-base">Quinoa Power Bowl</h3>
                    <span className="px-2 py-0.5 rounded-md bg-[#EBF2EB] text-[#2C3E2B] text-[10px] font-bold">Lunch</span>
                  </div>
                  <p className="text-xs text-textMuted mb-3">12:30 PM</p>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1 text-orange-600">
                      <FireIcon className="w-4 h-4" /> 480 kcal
                    </span>
                    <span className="flex items-center gap-1 text-[#7A9E7E]">
                      <span className="w-2 h-2 rounded-full bg-[#7A9E7E] inline-block"></span> 22 g
                    </span>
                  </div>
                </div>
              </div>

              {/* Meal Card 2 */}
              <div className="bg-white border border-border rounded-2xl overflow-hidden card-hover transition-all">
                <img 
                  src="https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80" 
                  alt="Greek Yogurt & Berries" 
                  className="w-full h-40 object-cover"
                />
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-textHeading text-base">Greek Yogurt &amp; Berries</h3>
                    <span className="px-2 py-0.5 rounded-md bg-[#FEF0EB] text-[#E8815A] text-[10px] font-bold">Breakfast</span>
                  </div>
                  <p className="text-xs text-textMuted mb-3">09:15 AM</p>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1 text-orange-600">
                      <FireIcon className="w-4 h-4" /> 310 kcal
                    </span>
                    <span className="flex items-center gap-1 text-[#7A9E7E]">
                      <span className="w-2 h-2 rounded-full bg-[#7A9E7E] inline-block"></span> 18 g
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Hydration Tracker Section */}
          <section className="bg-white rounded-[24px] border border-border p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 card-hover animate-slide-up relative overflow-hidden">
            <style>{`
              @keyframes waveMove {
                0% { transform: translate(-160px, 0); }
                100% { transform: translate(0, 0); }
              }
              .wave-animate-1 {
                animation: waveMove 3s infinite linear;
              }
              .wave-animate-2 {
                animation: waveMove 2s infinite linear;
              }
            `}</style>

            <div className="space-y-4 flex-1 w-full">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-textHeading">Hydration Tracker</h2>
                  <p className="text-sm text-textMuted mt-1">You've drunk {(hydrationML/1000).toFixed(2)}L of your 3.0L goal.</p>
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

              {/* Logging Presets Grid */}
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <button
                  onClick={() => handleAddWater(150)}
                  className="px-3 py-2.5 bg-[#F9FAF8] border border-[#E2E4DC] hover:border-[#7A9EBE] hover:bg-[#EBF2F8] text-textHeading hover:text-[#7A9EBE] rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>🥛</span> Cup (+150ml)
                </button>
                <button
                  onClick={() => handleAddWater(250)}
                  className="px-3 py-2.5 bg-[#F9FAF8] border border-[#E2E4DC] hover:border-[#7A9EBE] hover:bg-[#EBF2F8] text-textHeading hover:text-[#7A9EBE] rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>🥛</span> Glass (+250ml)
                </button>
                <button
                  onClick={() => handleAddWater(500)}
                  className="px-3 py-2.5 bg-[#F9FAF8] border border-[#E2E4DC] hover:border-[#7A9EBE] hover:bg-[#EBF2F8] text-textHeading hover:text-[#7A9EBE] rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>🍼</span> Bottle (+500ml)
                </button>
                <button
                  onClick={() => handleAddWater(750)}
                  className="px-3 py-2.5 bg-[#F9FAF8] border border-[#E2E4DC] hover:border-[#7A9EBE] hover:bg-[#EBF2F8] text-textHeading hover:text-[#7A9EBE] rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>🥤</span> Shaker (+750ml)
                </button>
              </div>
            </div>

            {/* Premium Animated Tumbler SVG */}
            <div className="relative w-32 h-36 flex-shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 120" className="w-full h-full">
                <defs>
                  <clipPath id="glass-water-clip">
                    {/* Inner glass contour matching shape */}
                    <path d="M 28 12 L 34 104 A 6 6 0 0 0 40 110 L 60 110 A 6 6 0 0 0 66 104 L 72 12 Z" />
                  </clipPath>
                </defs>

                {/* Glass Inner Liquid Content */}
                <g clipPath="url(#glass-water-clip)">
                  {/* Background Water Base */}
                  <rect
                    x="0"
                    y={112 - (hydrationPercent * 1.0)}
                    width="100"
                    height="120"
                    fill="#7A9EBE"
                    className="transition-all duration-1000 ease-out"
                    opacity="0.85"
                  />
                  
                  {/* Wave Layer 1 */}
                  <path
                    d="M 0 10 Q 20 5, 40 10 T 80 10 T 120 10 T 160 10 T 200 10 L 200 120 L 0 120 Z"
                    fill="#7A9EBE"
                    transform={`translate(0, ${100 - (hydrationPercent * 1.0)})`}
                    className="wave-animate-1 transition-all duration-1000 ease-out opacity-70"
                  />

                  {/* Wave Layer 2 */}
                  <path
                    d="M 0 10 Q 25 15, 50 10 T 100 10 T 150 10 T 200 10 L 200 120 L 0 120 Z"
                    fill="#5F88AD"
                    transform={`translate(0, ${102 - (hydrationPercent * 1.0)})`}
                    className="wave-animate-2 transition-all duration-1000 ease-out"
                  />
                </g>

                {/* Glass Exterior Shape */}
                <path
                  d="M 27 10 L 33 105 A 8 8 0 0 0 41 112 L 59 112 A 8 8 0 0 0 67 105 L 73 10"
                  fill="none"
                  stroke="#E2E4DC"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Measuring ticks on glass */}
                <line x1="68" y1="30" x2="72" y2="30" stroke="#E2E4DC" strokeWidth="1.5" />
                <line x1="66" y1="60" x2="70" y2="60" stroke="#E2E4DC" strokeWidth="1.5" />
                <line x1="64" y1="90" x2="68" y2="90" stroke="#E2E4DC" strokeWidth="1.5" />
              </svg>
              
              {/* Percent Indicator Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-4">
                <span className="text-base font-black text-textHeading drop-shadow-md select-none bg-white/70 px-2 py-0.5 rounded-full border border-border/40">
                  {hydrationPercent}%
                </span>
              </div>
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
              <div className="bg-white border border-[#E8815A]/20 rounded-2xl p-4 shadow-[0_2px_12px_-3px_rgba(232,129,90,0.06)] hover:shadow-[0_4px_16px_-2px_rgba(232,129,90,0.12)] transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between h-32">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-textMuted font-semibold">Calories</span>
                  <span className="w-7 h-7 rounded-full bg-[#FEF0EB] border border-[#FEE2D5] flex items-center justify-center text-xs">
                    🔥
                  </span>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-textHeading">1,240 <span className="text-xs text-textMuted font-medium">kcal</span></div>
                  <div className="w-full bg-[#F5F5F0] h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="bg-[#E8815A] h-full rounded-full" style={{ width: "62%" }} />
                  </div>
                </div>
              </div>

              {/* Sleep Card */}
              <div className="bg-white border border-[#7A9EBE]/20 rounded-2xl p-4 shadow-[0_2px_12px_-3px_rgba(122,158,190,0.06)] hover:shadow-[0_4px_16px_-2px_rgba(122,158,190,0.12)] transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between h-32">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-textMuted font-semibold">Sleep</span>
                  <span className="w-7 h-7 rounded-full bg-[#EBF2F8] border border-blueLight flex items-center justify-center text-xs">
                    🌙
                  </span>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-textHeading">7.5 <span className="text-xs text-textMuted font-medium">hrs</span></div>
                  <div className="w-full bg-[#F5F5F0] h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="bg-[#7A9EBE] h-full rounded-full" style={{ width: "93%" }} />
                  </div>
                </div>
              </div>

              {/* Active Card */}
              <div className="bg-white border border-[#D4A847]/20 rounded-2xl p-4 shadow-[0_2px_12px_-3px_rgba(212,168,71,0.06)] hover:shadow-[0_4px_16px_-2px_rgba(212,168,71,0.12)] transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between h-32">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-textMuted font-semibold">Active</span>
                  <span className="w-7 h-7 rounded-full bg-[#FEF9EB] border border-[#FDF0CD] flex items-center justify-center text-xs">
                    ⚡
                  </span>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-textHeading">45 <span className="text-xs text-textMuted font-medium">min</span></div>
                  <div className="w-full bg-[#F5F5F0] h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="bg-[#D4A847] h-full rounded-full" style={{ width: "75%" }} />
                  </div>
                </div>
              </div>
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
                  <Tooltip content={<CustomTooltip />} />
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
