import { useEffect, useState } from "react";
import { UploadCard } from "../components/UploadCard";
import { useUploadStore } from "../store/uploadStore";
import { Area, AreaChart, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { SearchIcon, FireIcon, WaterIcon, CameraIcon, SpinnerIcon, CloseIcon } from "../components/icons";

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

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [hydrationML, setHydrationML] = useState(1800); // 1.8L
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    return () => {
      cancelUpload();
    };
  }, [cancelUpload]);

  // Handle successful scan
  const handleFileSelected = async (file: File | null) => {
    clearError();
    const success = await uploadImage(file, "auto");
    if (success) {
      setIsUploadModalOpen(false);
      onUploadSuccess();
    }
  };

  const handleAddWater = () => {
    setHydrationML((prev) => Math.min(2500, prev + 250));
  };

  const hydrationPercent = Math.round((hydrationML / 2500) * 100);

  return (
    <div className="flex-1 min-h-screen bg-background relative overflow-y-auto pb-24 animate-fade-in">
      {/* Top Header */}
      <header className="px-8 pt-8 pb-4 flex justify-between items-center max-w-6xl mx-auto w-full">
        <div>
          <h1 className="text-3xl font-bold text-textHeading tracking-tight">Welcome back, Alex</h1>
          <p className="text-textMuted text-sm mt-1">You've reached 85% of your protein goal today.</p>
        </div>
        <div className="flex items-center gap-3 relative">
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

      {/* Main Grid Content */}
      <main className="px-8 py-4 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8">
        
        {/* Left Column (Meals & Hydration) */}
        <div className="space-y-8">
          
          {/* Today's Meals Section */}
          <section className="bg-white rounded-[24px] border border-border p-6 shadow-sm card-hover animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-textHeading">Today's Meals</h2>
              <button 
                onClick={() => setIsUploadModalOpen(true)}
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
          <section className="bg-white rounded-[24px] border border-border p-6 shadow-sm flex items-center justify-between card-hover animate-slide-up">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-textHeading">Hydration Tracker</h2>
                <p className="text-sm text-textMuted mt-1">You've drunk {(hydrationML/1000).toFixed(1)}L of your 2.5L goal.</p>
              </div>
              <button 
                onClick={handleAddWater}
                className="px-6 py-2 bg-[#F9FAF8] border border-[#E2E4DC] hover:border-[#7A9E7E] text-textHeading hover:text-[#7A9E7E] rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Add 250ml
              </button>
            </div>

            {/* Circular Progress Gauge */}
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <path
                  className="text-[#E2E4DC]"
                  strokeWidth="3.2"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-blue"
                  strokeDasharray={`${hydrationPercent}, 100`}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-textHeading">{hydrationPercent}%</span>
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

          {/* Evening Yoga Card */}
          <section className="bg-[#EBF2EB] border border-[#D4E6D5] rounded-2xl p-4 flex items-center justify-between cursor-pointer card-hover animate-slide-up">
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
        onClick={() => setIsUploadModalOpen(true)}
        className="fixed bottom-8 right-8 flex items-center gap-2 px-6 py-3.5 bg-[#9DB89F] hover:bg-[#7A9E7E] text-white rounded-full font-bold shadow-lg shadow-[#9DB89F]/30 hover:scale-105 active:scale-95 transition-all z-20"
      >
        <CameraIcon className="w-5 h-5" />
        <span>Scan Meal</span>
      </button>

      {/* Overlay Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-2xl border border-border shadow-2xl relative p-8">
            <button 
              onClick={() => {
                clearError();
                cancelUpload();
                setIsUploadModalOpen(false);
              }}
              className="absolute top-6 right-6 text-textMuted hover:text-textHeading transition-colors"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-textHeading tracking-tight">Scan Food Meal</h2>
              <p className="text-textMuted text-xs mt-1">Upload an image of your meal for AI-powered nutritional breakdown</p>
            </div>
            
            <div className="mt-6">
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
