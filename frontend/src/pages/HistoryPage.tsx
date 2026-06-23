import { useEffect, useMemo, useState } from "react";
import { fetchHistoryRequest, getHistoryErrorMessage } from "../services/historyApi";
import { useUploadStore } from "../store/uploadStore";
import type { HistoryPagination, UploadAnalysis } from "../types";
import { handleImageError } from "../utils/imageHelper";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import {
  CameraIcon,
  ChevronDownIcon,
  HomeIcon,
  SearchIcon,
  SlidersIcon,
} from "../components/icons";

type HistoryPageProps = {
  onNavigate: (nextPath: string) => void;
};

type SortValue = "asc" | "desc";

const foodCategories: Record<string, string> = {
  Banana: "Fruits",
  "Brown Rice": "Whole Grains",
  "Caesar Salad": "Vegetables",
  Carrots: "Root Vegetables",
  Cucumber: "Vegetables",
  "Greek Yogurt": "Dairy",
  "Grilled Chicken": "Proteins",
  "Grilled Chicken Breast": "Proteins",
  Lettuce: "Leafy Greens",
  "Quinoa Bowl": "Grains",
  "Steamed Broccoli": "Vegetables",
  Tomatoes: "Vegetables",
};

// Mock data for right column charts
const weeklyCalorieData = [
  { day: "M", calories: 1550 },
  { day: "T", calories: 1420 },
  { day: "W", calories: 1720 },
  { day: "T", calories: 1590 },
  { day: "F", calories: 1680 },
  { day: "S", calories: 1350 },
  { day: "S", calories: 1490 },
];

const macroSplitData = [
  { name: "Protein", value: 30, color: "#9DB89F" },
  { name: "Carbs", value: 45, color: "#E8815A" },
  { name: "Fats", value: 25, color: "#D4A847" },
];

const formatHistoryDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(new Date(value));

export const HistoryPage = ({ onNavigate }: HistoryPageProps) => {
  const setAnalysis = useUploadStore((state) => state.setAnalysis);
  const [historyItems, setHistoryItems] = useState<UploadAnalysis[]>([]);
  const [pagination, setPagination] = useState<HistoryPagination>({
    limit: 10,
    page: 1,
    total: 0,
  });
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<SortValue>("desc");
  const [isFetching, setIsFetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setPagination((current) => ({ ...current, page: 1 }));
    }, 350);
    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    const loadHistory = async () => {
      setIsFetching(true);
      setErrorMessage("");
      try {
        const response = await fetchHistoryRequest({
          limit: pagination.limit,
          page: pagination.page,
          search: searchTerm,
          sort,
          signal: controller.signal,
        });
        setHistoryItems((current) =>
          pagination.page === 1 ? response.data : [...current, ...response.data],
        );
        setPagination(response.pagination);
      } catch (error) {
        if ((error as { code?: string }).code === "ERR_CANCELED") return;
        setErrorMessage(getHistoryErrorMessage(error));
        if (pagination.page === 1) setHistoryItems([]);
      } finally {
        setIsFetching(false);
      }
    };
    void loadHistory();
    return () => controller.abort();
  }, [pagination.page, pagination.limit, searchTerm, sort]);

  // Static mock logs to populate page if empty
  const defaultHistory: UploadAnalysis[] = [
    {
      id: "1",
      imageUrl: "https://images.unsplash.com/photo-1485921325814-a5dad423a3b6?w=600&auto=format&fit=crop&q=80",
      createdAt: new Date().toISOString(),
      weight: 350,
      volume: 320,
      foods: [{ name: "Grilled Salmon Salad", confidence: 0.98 }],
      macros: { calories: 520, protein: 42, carbs: 12, fat: 28, fiber: 4 }
    },
    {
      id: "2",
      imageUrl: "https://images.unsplash.com/photo-1524351199679-46cddf530c04?w=600&auto=format&fit=crop&q=80",
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      weight: 250,
      volume: 240,
      foods: [{ name: "Turkey Sandwich", confidence: 0.95 }],
      macros: { calories: 380, protein: 24, carbs: 45, fat: 12, fiber: 5 }
    },
    {
      id: "3",
      imageUrl: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=600&auto=format&fit=crop&q=80",
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      weight: 220,
      volume: 200,
      foods: [{ name: "Avocado Toast", confidence: 0.92 }],
      macros: { calories: 310, protein: 8, carbs: 32, fat: 18, fiber: 6 }
    },
    {
      id: "4",
      imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop&q=80",
      createdAt: new Date(Date.now() - 3600000 * 25).toISOString(),
      weight: 400,
      volume: 380,
      foods: [{ name: "Beef Stir Fry", confidence: 0.90 }],
      macros: { calories: 640, protein: 38, carbs: 55, fat: 22, fiber: 3 }
    },
    {
      id: "5",
      imageUrl: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80",
      createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
      weight: 300,
      volume: 280,
      foods: [{ name: "Protein Shake", confidence: 0.89 }],
      macros: { calories: 180, protein: 30, carbs: 5, fat: 2, fiber: 1 }
    }
  ];

  const displayItems = historyItems.length > 0 ? historyItems : defaultHistory;
  const hasMore = historyItems.length > 0 && historyItems.length < pagination.total;

  return (
    <div className="flex-1 min-h-screen bg-background relative overflow-y-auto pb-24 px-4 sm:px-8 pt-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto w-full mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
          <div>
            <h1 className="text-3xl font-bold text-textHeading tracking-tight">Meal History</h1>
            <p className="text-textMuted text-sm mt-1">Your journey through healthy eating</p>
          </div>
          <button
            className="self-start sm:self-auto flex items-center gap-1.5 rounded-full bg-white border border-[#E2E4DC] hover:bg-surfaceAlt px-5 py-2.5 text-xs font-bold text-textHeading transition-colors shadow-sm"
            type="button"
            onClick={() => onNavigate("/")}
          >
            <CameraIcon className="h-4 w-4" />
            Upload Food
          </button>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8">
        
        {/* Left Column (Recent Logs List) */}
        <div className="space-y-6">
          
          {/* Search and Filters Strip (Collapsible) */}
          {showFilters && (
            <div className="flex items-center gap-4 animate-slide-up">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-textMuted" />
                <input
                  className="w-full rounded-2xl border border-border bg-white py-3 pl-11 pr-4 text-sm text-textHeading placeholder-textMuted focus:border-primary focus:outline-none shadow-sm"
                  placeholder="Search history..."
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    className="appearance-none rounded-2xl border border-border bg-white px-5 py-3 pr-10 text-sm font-bold text-textHeading focus:border-primary focus:outline-none cursor-pointer shadow-sm"
                    value={sort}
                    onChange={(event) => {
                      setSort(event.target.value as SortValue);
                      setPagination((current) => ({ ...current, page: 1 }));
                    }}
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-textMuted" />
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-danger/50 bg-danger/10 px-6 py-4 text-sm font-medium text-danger">
              {errorMessage}
            </div>
          )}

          {/* Logs timeline */}
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm font-bold text-textHeading uppercase tracking-wider">Recent Logs</div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#E2E4DC] hover:bg-surfaceAlt text-textHeading rounded-xl text-xs font-bold transition-all shadow-sm"
                type="button"
              >
                <SlidersIcon className="h-3.5 w-3.5 text-textMuted" /> Filters
              </button>
            </div>
            
            <div className="space-y-4">
              {displayItems.map((item) => {
                const primaryFood = item.foods[0];
                const displayName = primaryFood?.name || "Analyzed Meal";
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setAnalysis(item);
                      onNavigate("/results");
                    }}
                    className="w-full rounded-[24px] border border-border bg-white p-4 text-left hover:shadow-md transition-shadow flex items-center gap-4"
                  >
                    <img
                      src={item.imageUrl}
                      alt={displayName}
                      onError={(e) => handleImageError(e, displayName)}
                      className="h-20 w-20 rounded-2xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className="font-bold text-textHeading text-base truncate capitalize">{displayName}</h3>
                        <span className="text-sm font-bold text-textHeading shrink-0">{Math.round(item.macros.calories)} kcal</span>
                      </div>
                      <p className="text-xs text-textMuted mt-1">{formatHistoryDate(item.createdAt)}</p>
                      
                      {/* Macros row */}
                      <div className="mt-3 flex gap-4 text-xs font-semibold text-textMuted">
                        <span>P: {Math.round(item.macros.protein)}g</span>
                        <span>C: {Math.round(item.macros.carbs)}g</span>
                        <span>F: {Math.round(item.macros.fat)}g</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {hasMore && (
            <button
              className="mt-8 flex w-full items-center justify-center rounded-xl border border-border bg-white py-4 text-sm font-bold text-textHeading hover:bg-surfaceAlt transition-colors shadow-sm"
              disabled={isFetching}
              type="button"
              onClick={() =>
                setPagination((current) => ({
                  ...current,
                  page: current.page + 1,
                }))
              }
            >
              {isFetching ? "Loading..." : "Load More History"}
            </button>
          )}
        </div>

        {/* Right Column (Analytics & Tips) */}
        <div className="space-y-8">
          
          {/* Calorie Intake Bar Chart */}
          <section className="bg-white rounded-[24px] border border-border p-6 shadow-sm">
            <h2 className="text-base font-bold text-textHeading mb-4 uppercase tracking-wider">Calorie Intake (Last 7 Days)</h2>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyCalorieData} margin={{ left: -10, right: 0, top: 5, bottom: 0 }}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#888888", fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="calories" fill="#9DB89F" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Average Macronutrients Donut Chart */}
          <section className="bg-white rounded-[24px] border border-border p-6 shadow-sm">
            <h2 className="text-base font-bold text-textHeading mb-6 uppercase tracking-wider">Average Macronutrients</h2>
            <div className="flex flex-col items-center justify-center gap-6">
              
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
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-extrabold text-textHeading">30%</span>
                  <span className="text-[9px] text-textMuted font-bold uppercase">Protein</span>
                </div>
              </div>

              {/* Legends list */}
              <div className="w-full space-y-4">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#9DB89F]"></span>
                    <span className="text-textHeading">Protein</span>
                  </div>
                  <span className="text-textMuted">30%</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E8815A]"></span>
                    <span className="text-textHeading">Carbs</span>
                  </div>
                  <span className="text-textMuted">45%</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D4A847]"></span>
                    <span className="text-textHeading">Fat</span>
                  </div>
                  <span className="text-textMuted">25%</span>
                </div>
              </div>
            </div>
          </section>

          {/* Weekly Insight Lightbulb Card */}
          <section className="bg-[#EBF2EB] border border-[#D4E6D5] rounded-[24px] p-6 shadow-sm flex gap-3.5 items-start">
            <span className="text-xl text-[#2C3E2B] mt-0.5">💡</span>
            <div>
              <h4 className="font-bold text-[#2C3E2B] text-sm">Weekly Insight</h4>
              <p className="text-xs text-textBody leading-relaxed mt-1">
                You've increased your protein intake by 12% compared to last week. Great progress!
              </p>
            </div>
          </section>

        </div>
      </main>

      {/* Floating Action Button for logging meal */}
      <button
        onClick={() => onNavigate("/")}
        className="fixed bottom-8 right-8 flex items-center gap-2 px-6 py-3.5 bg-[#9DB89F] hover:bg-[#7A9E7E] text-white rounded-full font-bold shadow-lg shadow-[#9DB89F]/30 hover:scale-105 active:scale-95 transition-all z-20"
      >
        <CameraIcon className="w-5 h-5" />
        <span>Log Meal</span>
      </button>

    </div>
  );
};
