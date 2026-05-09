import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CameraIcon, ScaleIcon } from "./icons";
import { fetchProgressLogsRequest, uploadProgressLogRequest } from "../services/profileApi";
import type { ProgressLog } from "../types";

export const ProgressTracker = ({ onWeightUpdate }: { onWeightUpdate?: () => void }) => {
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form state
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
      await uploadProgressLogRequest(parseFloat(weight), date, "", file);
      
      // Reset form
      setWeight("");
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

  const chartData = logs.map(log => ({
    name: new Date(log.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    weight: log.weight_kg,
  }));

  const photos = [...logs].reverse().filter(log => log.image_url);

  return (
    <div className="space-y-8">
      <div className="bg-panel border border-panelBorder rounded-3xl p-6 lg:p-8">
        <h2 className="text-xl font-bold text-textMain mb-6 flex items-center gap-2">
          <ScaleIcon className="w-6 h-6 text-primary" />
          Weight Progression
        </h2>
        
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-textMuted">Loading chart...</div>
        ) : logs.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#FF7A12" 
                  strokeWidth={3}
                  dot={{ fill: "#FF7A12", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis domain={["dataMin - 2", "dataMax + 2"]} stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#191F2B", borderColor: "#2D3748", borderRadius: "12px", color: "#F8FAFF" }}
                  itemStyle={{ color: "#FF7A12", fontWeight: "bold" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-textMuted border border-dashed border-panelBorder rounded-2xl">
            No weight data logged yet
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-panel border border-panelBorder rounded-3xl p-6">
          <h3 className="text-lg font-bold text-textMain mb-4">Log Progress</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-textMuted mb-1">Date</label>
              <input 
                type="date" 
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full bg-background border border-panelBorder rounded-xl px-4 py-2.5 text-textMain focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textMuted mb-1">Weight (kg)</label>
              <input 
                type="number" 
                step="0.1"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                required
                placeholder="e.g. 75.5"
                className="w-full bg-background border border-panelBorder rounded-xl px-4 py-2.5 text-textMain focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textMuted mb-1">Progress Photo (Optional)</label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-panelBorder rounded-xl cursor-pointer hover:border-primary/50 hover:bg-background/50 transition-colors overflow-hidden relative">
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
              className="w-full bg-primary hover:bg-primaryHover text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {isUploading ? "Saving..." : "Save Entry"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-panel border border-panelBorder rounded-3xl p-6">
          <h3 className="text-lg font-bold text-textMain mb-4 flex items-center gap-2">
            <CameraIcon className="w-5 h-5 text-primary" />
            Photo Gallery
          </h3>
          {photos.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
              {photos.map((log) => (
                <div key={log._id} className="relative min-w-[200px] h-[300px] rounded-2xl overflow-hidden snap-center group border border-panelBorder">
                  <img src={log.image_url!} alt="Progress" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="font-bold text-white">{log.weight_kg} kg</div>
                    <div className="text-xs text-white/70">{new Date(log.date).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full min-h-[200px] flex items-center justify-center text-textMuted border border-dashed border-panelBorder rounded-2xl">
              Upload photos to see your transformation gallery
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
