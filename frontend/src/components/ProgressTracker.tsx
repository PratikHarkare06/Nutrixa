import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CameraIcon, ScaleIcon } from "./icons";
import { fetchProgressLogsRequest, uploadProgressLogRequest } from "../services/profileApi";
import type { ProgressLog } from "../types";

export const ProgressTracker = ({ onWeightUpdate }: { onWeightUpdate?: () => void }) => {
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form state
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [muscleMass, setMuscleMass] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<"weight" | "bodyFat" | "muscleMass">("weight");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const res = await fetchProgressLogsRequest();
      if (res.success) {
        // Reverse array for chart (oldest to newest)
        setLogs(res.data.reverse());
      }
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || !date) return;
    
    try {
      setIsUploading(true);
      const bodyFatVal = bodyFat ? parseFloat(bodyFat) : null;
      const muscleMassVal = muscleMass ? parseFloat(muscleMass) : null;

      await uploadProgressLogRequest(
        parseFloat(weight), 
        date, 
        "", 
        file,
        bodyFatVal,
        muscleMassVal
      );
      
      // Reset form
      setWeight("");
      setBodyFat("");
      setMuscleMass("");
      setFile(null);
      setPreviewUrl(null);
      
      // Reload logs and notify parent
      await loadLogs();
      if (onWeightUpdate) onWeightUpdate();
      
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;

  // Calculate stats
  const calculatedLbm = latestLog?.body_fat_pct && latestLog.weight_kg
    ? parseFloat((latestLog.weight_kg * (1 - latestLog.body_fat_pct / 100)).toFixed(1))
    : null;

  const chartData = logs.map(log => ({
    name: new Date(log.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    weight: log.weight_kg,
    bodyFat: log.body_fat_pct || null,
    muscleMass: log.muscle_mass_kg || null,
  }));

  const photos = [...logs].reverse().filter(log => log.image_url);

  // Chart configuration based on active tab
  const getChartConfig = () => {
    switch (activeTab) {
      case "bodyFat":
        return {
          dataKey: "bodyFat",
          stroke: "#E8815A",
          fill: "url(#colorBodyFat)",
          domain: ["dataMin - 1", "dataMax + 1"],
          label: "Body Fat (%)",
          color: "#E8815A"
        };
      case "muscleMass":
        return {
          dataKey: "muscleMass",
          stroke: "#7A9EBE",
          fill: "url(#colorMuscle)",
          domain: ["dataMin - 1", "dataMax + 1"],
          label: "Muscle Mass (kg)",
          color: "#7A9EBE"
        };
      default:
        return {
          dataKey: "weight",
          stroke: "#7A9E7E",
          fill: "url(#colorWeight)",
          domain: ["dataMin - 2", "dataMax + 2"],
          label: "Weight (kg)",
          color: "#7A9E7E"
        };
    }
  };

  const activeChart = getChartConfig();

  return (
    <div className="space-y-8">
      {/* Body Composition Summary Cards */}
      {latestLog && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Current Weight</p>
            <h4 className="text-xl font-black text-textHeading mt-1">{latestLog.weight_kg} <span className="text-xs font-semibold text-textMuted">kg</span></h4>
          </div>
          <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Body Fat</p>
            <h4 className="text-xl font-black text-[#E8815A] mt-1">
              {latestLog.body_fat_pct ? `${latestLog.body_fat_pct}%` : "—"}
            </h4>
          </div>
          <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Muscle Mass</p>
            <h4 className="text-xl font-black text-[#7A9EBE] mt-1">
              {latestLog.muscle_mass_kg ? `${latestLog.muscle_mass_kg} kg` : "—"}
            </h4>
          </div>
          <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Est. Lean Mass</p>
            <h4 className="text-xl font-black text-[#7A9E7E] mt-1">
              {calculatedLbm ? `${calculatedLbm} kg` : "—"}
            </h4>
          </div>
        </div>
      )}

      {/* Main Chart Card */}
      <div className="bg-white border border-border rounded-[24px] p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-textHeading flex items-center gap-2">
            <ScaleIcon className="w-6 h-6 text-[#7A9E7E]" />
            Body Composition Progression
          </h2>
          {/* Tab Selector */}
          <div className="flex bg-[#F5F6F1] rounded-xl p-1 border border-border self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("weight")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "weight"
                  ? "bg-white text-textHeading shadow-sm"
                  : "text-textMuted hover:text-textHeading"
              }`}
            >
              Weight
            </button>
            <button
              onClick={() => setActiveTab("bodyFat")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "bodyFat"
                  ? "bg-white text-[#E8815A] shadow-sm"
                  : "text-textMuted hover:text-[#E8815A]"
              }`}
            >
              Body Fat %
            </button>
            <button
              onClick={() => setActiveTab("muscleMass")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "muscleMass"
                  ? "bg-white text-[#7A9EBE] shadow-sm"
                  : "text-textMuted hover:text-[#7A9EBE]"
              }`}
            >
              Muscle Mass
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-textMuted">Loading chart...</div>
        ) : logs.length >= 2 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7A9E7E" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#7A9E7E" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBodyFat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E8815A" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#E8815A" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMuscle" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7A9EBE" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#7A9EBE" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis domain={activeChart.domain} stroke="#888888" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E4DC", borderRadius: "12px", color: "#2C2C2C" }}
                  itemStyle={{ color: activeChart.color, fontWeight: "bold" }}
                />
                <Area
                  type="monotone"
                  dataKey={activeChart.dataKey}
                  stroke={activeChart.stroke}
                  strokeWidth={3}
                  fill={activeChart.fill}
                  dot={{ fill: activeChart.stroke, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-textMuted border border-dashed border-border rounded-2xl p-6 text-center">
            <ScaleIcon className="w-8 h-8 mb-2 text-textMuted opacity-50" />
            <p className="text-sm font-semibold">Log at least 2 entries to see progression charts</p>
            <p className="text-xs text-textMuted/80 mt-1">This will plot your weight, body fat %, and muscle trends over time.</p>
          </div>
        )}
      </div>

      {/* Inputs and photo list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white border border-border rounded-[24px] p-6 shadow-sm">
          <h3 className="text-lg font-bold text-textHeading mb-4">Log Composition</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-textMuted mb-1">Date</label>
              <input 
                type="date" 
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-textHeading focus:border-[#7A9E7E] focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-textMuted mb-1">Weight (kg)</label>
              <input 
                type="number" 
                step="0.1"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                required
                placeholder="e.g. 75.5"
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-textHeading focus:border-[#7A9E7E] focus:outline-none text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-textMuted mb-1">Body Fat % (Opt)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={bodyFat}
                  onChange={e => setBodyFat(e.target.value)}
                  placeholder="e.g. 15.2"
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-textHeading focus:border-[#E8815A] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-textMuted mb-1">Muscle (kg) (Opt)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={muscleMass}
                  onChange={e => setMuscleMass(e.target.value)}
                  placeholder="e.g. 34.1"
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-textHeading focus:border-[#7A9EBE] focus:outline-none text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-textMuted mb-1">Progress Photo (Optional)</label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-[#7A9E7E]/50 hover:bg-background/50 transition-colors overflow-hidden relative">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-textMuted">
                    <CameraIcon className="w-8 h-8 mb-2" />
                    <span className="text-xs">Click to upload photo</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
            <button 
              type="submit" 
              disabled={isUploading}
              className="w-full bg-[#9DB89F] hover:bg-[#7A9E7E] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 text-sm shadow-sm"
            >
              {isUploading ? "Saving..." : "Save Entry"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white border border-border rounded-[24px] p-6 shadow-sm">
          <h3 className="text-lg font-bold text-textHeading mb-4 flex items-center gap-2">
            <CameraIcon className="w-5 h-5 text-[#7A9E7E]" />
            Photo Gallery
          </h3>
          {photos.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
              {photos.map((log) => (
                <div key={log._id} className="relative min-w-[200px] h-[300px] rounded-2xl overflow-hidden snap-center group border border-border">
                  <img src={log.image_url!} alt="Progress" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="font-bold text-white">{log.weight_kg} kg</div>
                    {log.body_fat_pct && <div className="text-xs text-white/90">Fat: {log.body_fat_pct}%</div>}
                    {log.muscle_mass_kg && <div className="text-xs text-white/90">Muscle: {log.muscle_mass_kg} kg</div>}
                    <div className="text-[10px] text-white/60 mt-1">{new Date(log.date).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full min-h-[200px] flex items-center justify-center text-textMuted border border-dashed border-border rounded-2xl">
              Upload photos to see your transformation gallery
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
