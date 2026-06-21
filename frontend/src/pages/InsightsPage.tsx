import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { fetchHistoryRequest, getHistoryErrorMessage } from "../services/historyApi";
import type { UploadAnalysis } from "../types";
import {
  FireIcon,
  WaterIcon,
  ScaleIcon,
  ClockIcon,
  HomeIcon,
} from "../components/icons";

type InsightsPageProps = {
  onNavigate: (nextPath: string) => void;
};

// Mock data to match mockup screenshot
const calorieVsGoalData = [
  { day: "Mon", actual: 1650, goal: 1900 },
  { day: "Tue", actual: 1800, goal: 1900 },
  { day: "Wed", actual: 1550, goal: 1900 },
  { day: "Thu", actual: 1950, goal: 1900 },
  { day: "Fri", actual: 1750, goal: 1900 },
  { day: "Sat", actual: 1820, goal: 1900 },
  { day: "Sun", actual: 1790, goal: 1900 },
];

const macroConsistencyData = [
  { name: "P", val: 80 },
  { name: "C", val: 95 },
  { name: "F", val: 70 },
  { name: "P", val: 88 },
  { name: "C", val: 92 },
  { name: "F", val: 65 },
  { name: "P", val: 85 },
];

const sugarIntakeData = [
  { name: "1", val: 24 },
  { name: "2", val: 29 },
  { name: "3", val: 21 },
  { name: "4", val: 32 },
  { name: "5", val: 18 },
  { name: "6", val: 15 },
  { name: "7", val: 27 },
  { name: "8", val: 20 },
];

const macroSplitData = [
  { name: "Protein", value: 30, color: "#9DB89F" },
  { name: "Carbs", value: 45, color: "#E8815A" },
  { name: "Fats", value: 25, color: "#D4A847" },
];

const InsightsCalorieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border rounded-xl p-3 shadow-md">
        <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Calories</p>
        <p className="text-sm font-extrabold text-textHeading mt-0.5">Actual: {payload[0].value} kcal</p>
        {payload[1] && (
          <p className="text-xs font-semibold text-textMuted mt-0.5">Goal: {payload[1].value} kcal</p>
        )}
      </div>
    );
  }
  return null;
};

export const InsightsPage = ({ onNavigate }: InsightsPageProps) => {
  const [historyItems, setHistoryItems] = useState<UploadAnalysis[]>([]);
  const [timeframe, setTimeframe] = useState<"7D" | "30D" | "90D">("7D");
  const [errorMessage, setErrorMessage] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const loadInsights = async () => {
      setIsFetching(true);
      setErrorMessage("");
      try {
        const response = await fetchHistoryRequest({
          limit: 14,
          page: 1,
          sort: "desc",
          signal: controller.signal,
        });
        setHistoryItems(response.data);
      } catch (error) {
        if ((error as { code?: string }).code !== "ERR_CANCELED") {
          setErrorMessage(getHistoryErrorMessage(error));
        }
      } finally {
        setIsFetching(false);
      }
    };
    void loadInsights();
    return () => controller.abort();
  }, []);

  return (
    <div className="flex-1 min-h-screen bg-background relative overflow-y-auto pb-24 px-4 sm:px-8 pt-8">
      
      {/* Top Header */}
      <header className="max-w-6xl mx-auto w-full mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
          <div>
            <h1 className="text-3xl font-bold text-textHeading tracking-tight">Dietary Insights</h1>
            <p className="text-textMuted text-sm mt-1">Visualizing your nutrition trends over the last 30 days</p>
          </div>
          
          <div className="flex items-center gap-3 self-start sm:self-auto">
            {/* Timeframe Filter Pills */}
            <div className="bg-[#E2E4DC]/40 border border-border rounded-full p-1 flex">
              {(["7D", "30D", "90D"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    timeframe === t 
                      ? "bg-white text-textHeading shadow-sm" 
                      : "text-textMuted hover:text-textHeading"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Profile AR badge */}
            <div 
              onClick={() => onNavigate("/profile")}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-[#EBF2EB] border border-[#D4E6D5] text-[#2C3E2B] font-bold text-sm shadow-sm cursor-pointer hover:bg-[#D4E6D5] transition-colors"
            >
              AR
            </div>
          </div>
        </div>
      </header>

      {/* Metric Cards Row */}
      <section className="max-w-6xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Calories Card */}
        <div className="bg-white rounded-[24px] border border-border p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#FDEAEA] border border-[#FDEAEA] flex items-center justify-center text-[#D47A7A] shrink-0">
            <FireIcon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-extrabold text-textHeading">1,942</span>
              <span className="text-[10px] font-bold text-[#E8815A]">+4%</span>
            </div>
            <p className="text-xs text-textMuted font-medium mt-0.5">Avg Calories/Day</p>
          </div>
        </div>

        {/* Hydration Card */}
        <div className="bg-white rounded-[24px] border border-border p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blueLight border border-blueLight flex items-center justify-center text-blue shrink-0">
            <WaterIcon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-extrabold text-textHeading">2.4L</span>
              <span className="text-[10px] font-bold text-[#7A9EBE]">+12%</span>
            </div>
            <p className="text-xs text-textMuted font-medium mt-0.5">Avg Hydration</p>
          </div>
        </div>

        {/* Weight Card */}
        <div className="bg-white rounded-[24px] border border-border p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#EBF2EB] border border-[#D4E6D5] flex items-center justify-center text-[#7A9E7E] shrink-0">
            <ScaleIcon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-extrabold text-textHeading">74.2kg</span>
              <span className="text-[10px] font-bold text-[#7A9E7E]">-0.8kg</span>
            </div>
            <p className="text-xs text-textMuted font-medium mt-0.5">Current Weight</p>
          </div>
        </div>

        {/* Fasting Card */}
        <div className="bg-white rounded-[24px] border border-border p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#FEF9EB] border border-[#FDF0CD] flex items-center justify-center text-[#D4A847] shrink-0">
            <ClockIcon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-extrabold text-textHeading">14:10</span>
              <span className="text-[10px] font-bold text-[#D4A847]">+2h</span>
            </div>
            <p className="text-xs text-textMuted font-medium mt-0.5">Avg Fasting Window</p>
          </div>
        </div>
      </section>

      {/* Main Grid Content */}
      <main className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8">
        
        {/* Left Column (Charts) */}
        <div className="space-y-8">
          
          {/* Calorie Intake vs Goal Area Chart */}
          <section className="bg-white rounded-[24px] border border-border p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-textHeading">Calorie Intake vs. Goal</h2>
              <div className="flex gap-4 text-xs font-bold text-textMuted">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#9DB89F]"></span> Actual
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E2E4DC]"></span> Goal
                </span>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={calorieVsGoalData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="insightsCalorieFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9DB89F" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#9DB89F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#888888", fontSize: 11 }} />
                  <Tooltip content={<InsightsCalorieTooltip />} />
                  <Area type="monotone" dataKey="actual" stroke="#9DB89F" strokeWidth={2.5} fill="url(#insightsCalorieFill)" dot={{ fill: "#9DB89F", r: 4, strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="goal" stroke="#C8CBBC" strokeWidth={1.5} fill="none" strokeDasharray="4 4" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Side-by-side Smaller Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Macro Consistency Bar Chart */}
            <section className="bg-white rounded-[24px] border border-border p-6 shadow-sm">
              <h3 className="text-base font-bold text-textHeading mb-4">Macro Consistency</h3>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={macroConsistencyData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#888888", fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="val" fill="#9DB89F" radius={[4, 4, 0, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Sugar Intake Line Chart */}
            <section className="bg-white rounded-[24px] border border-border p-6 shadow-sm">
              <h3 className="text-base font-bold text-textHeading mb-4">Sugar Intake (g)</h3>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sugarIntakeData}>
                    <Tooltip />
                    <Line type="monotone" dataKey="val" stroke="#D47A7A" strokeWidth={2.5} dot={{ fill: '#D47A7A', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        </div>

        {/* Right Column (Macro Split & Health Nugget) */}
        <div className="space-y-8">
          
          {/* Average Macro Split Card */}
          <section className="bg-white rounded-[24px] border border-border p-6 shadow-sm">
            <h2 className="text-lg font-bold text-textHeading mb-6">Average Macro Split</h2>
            
            <div className="flex flex-col items-center justify-center gap-6">
              
              {/* Donut Chart */}
              <div className="relative w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={macroSplitData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {macroSplitData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legends list */}
              <div className="w-full">
                <div className="flex items-center justify-center gap-4 text-xs font-semibold text-textMuted mb-6">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#9DB89F]"></span> Protein 30%
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E8815A]"></span> Carbs 45%
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D4A847]"></span> Fats 25%
                  </span>
                </div>

                <div className="w-full h-px bg-[#F5F5F0] mb-6" />

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-textHeading">Protein</span>
                    </div>
                    <span className="text-sm font-bold text-textHeading">92g</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#4A4A4A]">Carbohydrates</span>
                    </div>
                    <span className="text-sm font-bold text-textHeading">210g</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-textHeading">Healthy Fats</span>
                    </div>
                    <span className="text-sm font-bold text-textHeading">64g</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* AI Health Nugget Card */}
          <section className="bg-[#EBF2EB] border border-[#D4E6D5] rounded-[24px] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-[#2C3E2B]">
              <span className="text-lg">✨</span>
              <h3 className="font-bold text-base">AI Health Nugget</h3>
            </div>
            <p className="text-sm text-textBody leading-relaxed">
              Your fiber intake is 15% lower on weekends. Try adding chia seeds to your Saturday brunch to maintain digestive consistency.
            </p>
            <button 
              onClick={() => onNavigate("/diet-plan")}
              className="text-xs font-bold text-[#7A9E7E] hover:text-[#5C7A60] transition-colors block"
            >
              → See High-Fiber Recipes
            </button>
          </section>
        </div>
      </main>
    </div>
  );
};
