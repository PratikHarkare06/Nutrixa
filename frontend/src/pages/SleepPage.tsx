import { useEffect, useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart } from "recharts";
import { fetchSleepLogsRequest, logSleepRequest, fetchSleepInsightsRequest } from "../services/profileApi";
import type { SleepLog } from "../types";
import { SparklesIcon, CalendarIcon, ClockIcon } from "../components/icons";

export const SleepPage = () => {
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insights, setInsights] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Log Form State
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [duration, setDuration] = useState("7.5");
  const [quality, setQuality] = useState(75);
  const [deepSleep, setDeepSleep] = useState("2.0");
  const [remSleep, setRemSleep] = useState("1.5");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadSleepData();
  }, []);

  const loadSleepData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetchSleepLogsRequest();
      if (res.success) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error("Failed to load sleep data", err);
      setError("Could not load sleep logs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSleep = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setIsSaving(true);
      const res = await logSleepRequest({
        date,
        duration_hours: parseFloat(duration),
        quality_score: quality,
        deep_sleep_hours: deepSleep ? parseFloat(deepSleep) : 0,
        rem_sleep_hours: remSleep ? parseFloat(remSleep) : 0,
        notes,
      });

      if (res.success) {
        // Reset non-essential form fields
        setNotes("");
        // Reload
        await loadSleepData();
        // Trigger insights refresh silently or informatively
        await handleGenerateInsights();
      }
    } catch (err) {
      console.error("Failed to save sleep log", err);
      setError("Failed to save sleep log. Make sure all values are correct.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateInsights = async () => {
    try {
      setIsGeneratingInsights(true);
      const res = await fetchSleepInsightsRequest();
      if (res.success) {
        setInsights(res.data);
      }
    } catch (err) {
      console.error("Failed to generate sleep insights", err);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // Compute metrics
  const avgDuration = logs.length > 0
    ? (logs.reduce((sum, log) => sum + log.duration_hours, 0) / logs.length).toFixed(1)
    : "—";

  const avgQuality = logs.length > 0
    ? Math.round(logs.reduce((sum, log) => sum + log.quality_score, 0) / logs.length)
    : "—";

  const chartData = logs.map((log) => ({
    name: new Date(log.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    Duration: log.duration_hours,
    Quality: log.quality_score,
  }));

  return (
    <div className="flex-1 min-h-screen bg-background relative overflow-y-auto pb-24 px-4 sm:px-8 pt-8 animate-fade-in">
      <header className="max-w-6xl mx-auto w-full flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-textHeading tracking-tight">Sleep Quality Tracker</h1>
          <p className="text-textMuted text-sm mt-1">
            Monitor your sleep patterns and get AI-powered deep sleep coaching.
          </p>
        </div>
      </header>

      {error && (
        <div className="max-w-6xl mx-auto w-full mb-6 p-4 rounded-2xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold flex items-center justify-between shadow-sm">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-danger font-bold hover:text-rose-900">✕</button>
        </div>
      )}

      {/* Main Grid Layout */}
      <main className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column (Logs and Form) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Avg Duration</p>
              <h4 className="text-2xl font-black text-textHeading mt-1">{avgDuration} <span className="text-xs font-medium text-textMuted">hrs</span></h4>
            </div>
            <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Avg Quality</p>
              <h4 className="text-2xl font-black text-[#E8815A] mt-1">{avgQuality}{avgQuality !== "—" ? "%" : ""}</h4>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white border border-border rounded-[24px] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-textHeading mb-4">Log Last Night's Sleep</h3>
            <form onSubmit={handleSaveSleep} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-textMuted mb-1">Date of Sleep</label>
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-textHeading focus:border-[#7A9E7E] focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-textMuted mb-1">Sleep Duration: <span className="font-extrabold text-[#7A9E7E]">{duration} hrs</span></label>
                <input 
                  type="range" 
                  min="0" 
                  max="16" 
                  step="0.5"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full h-1.5 bg-[#F5F6F1] rounded-lg appearance-none cursor-pointer accent-[#7A9E7E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-textMuted mb-1 flex justify-between">
                  <span>Sleep Quality:</span>
                  <span className="font-extrabold text-[#E8815A]">{quality}%</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-[#F5F6F1] rounded-lg appearance-none cursor-pointer accent-[#E8815A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-textMuted mb-1">Deep (hrs)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={deepSleep} 
                    onChange={(e) => setDeepSleep(e.target.value)} 
                    placeholder="e.g. 1.8"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-textHeading focus:border-indigo-400 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-textMuted mb-1">REM (hrs)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={remSleep} 
                    onChange={(e) => setRemSleep(e.target.value)} 
                    placeholder="e.g. 1.5"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-textHeading focus:border-indigo-400 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-textMuted mb-1">Notes</label>
                <textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Any waking up in between, caffeine late, etc."
                  rows={2}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 text-textHeading focus:border-[#7A9E7E] focus:outline-none text-sm resize-none"
                />
              </div>

              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full bg-[#7A9EBE] hover:bg-[#5D80A0] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 text-sm shadow-sm"
              >
                {isSaving ? "Saving Log..." : "Save Sleep Log"}
              </button>
            </form>
          </div>
        </div>

        {/* Right columns (Charts and AI Insights) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Chart Component */}
          <div className="bg-white border border-border rounded-[24px] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-textHeading mb-4">7-Day Sleep Analysis</h3>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-textMuted">Loading sleep progression...</div>
            ) : chartData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E4DC" />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" label={{ value: "Hours", angle: -90, position: "insideLeft", style: { textAnchor: "middle", fill: "#888888", fontSize: 10 } }} fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: "Quality %", angle: 90, position: "insideRight", style: { textAnchor: "middle", fill: "#888888", fontSize: 10 } }} fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E2E4DC" }} />
                    <Bar yAxisId="left" dataKey="Duration" fill="#7A9EBE" radius={[8, 8, 0, 0]} maxBarSize={30} />
                    <Line yAxisId="right" type="monotone" dataKey="Quality" stroke="#E8815A" strokeWidth={3} dot={{ fill: "#E8815A", r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-textMuted border border-dashed border-border rounded-2xl">
                No recent sleep entries logged. Log sleep logs on the left to populate charts.
              </div>
            )}
          </div>

          {/* AI insights Coach */}
          <div className="bg-gradient-to-br from-[#EBF2EB] to-[#F5F5F0] border border-[#D4E6D5] rounded-[24px] p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-[#7A9E7E]" />
                <h3 className="font-extrabold text-[#2C3E2B] text-base">AI Sleep Coach</h3>
              </div>
              <button
                onClick={handleGenerateInsights}
                disabled={isGeneratingInsights}
                className="flex items-center gap-1.5 px-4 py-2 bg-white text-xs font-bold text-[#2C3E2B] border border-[#D4E6D5] rounded-xl hover:bg-[#D4E6D5]/40 transition-colors shadow-sm disabled:opacity-50"
              >
                {isGeneratingInsights ? "Analyzing..." : "Get Insights"}
              </button>
            </div>

            <div className="text-sm text-textBody leading-relaxed min-h-[100px]">
              {isGeneratingInsights ? (
                <div className="flex flex-col items-center justify-center py-6 text-textMuted gap-2">
                  <div className="animate-spin h-6 w-6 border-2 border-[#7A9E7E] border-t-transparent rounded-full" />
                  <span className="text-xs">Analyzing meals, workouts, and sleep quality logs...</span>
                </div>
              ) : insights ? (
                <div className="prose prose-sm max-w-none whitespace-pre-line text-[#2C3E2B] font-medium">
                  {insights}
                </div>
              ) : (
                <p className="text-textMuted text-xs font-semibold py-4">
                  Click the **Get Insights** button to analyze how your daily macros, workout sessions, and hydration affect your sleep architecture.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
