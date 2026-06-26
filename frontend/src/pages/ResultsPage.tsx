import { useMemo, useState, useEffect } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";
import {
  CameraIcon,
  HomeIcon,
  InfoIcon,
  MacroChartIcon,
  PlusIcon,
  ShareIcon,
} from "../components/icons";
import { useUploadStore } from "../store/uploadStore";
import { handleImageError } from "../utils/imageHelper";
import { fetchProfileRequest, fetchAllergenSubstitutesRequest } from "../services/profileApi";

type ResultsPageProps = {
  onBack: () => void;
  onNavigate: (nextPath: string) => void;
};

const foodCategories: Record<string, string> = {
  "Grilled Chicken": "Lean Protein",
  "Brown Rice": "Whole Grains",
  "Steamed Broccoli": "Vegetables",
  "Grilled Atlantic Salmon": "Lean Protein",
  "Steamed Asparagus": "Vegetables",
  "Lemon Vinaigrette": "Healthy Fats",
  "Banana": "Fruit",
  "Avocado": "Healthy Fats",
  "Yogurt": "Dairy",
  Lettuce: "Leafy Greens",
  Tomatoes: "Vegetables",
  Cucumber: "Vegetables",
  Carrots: "Root Vegetables",
};

const macroColors = {
  protein: "#9DB89F", // Sage Green
  carbs: "#E8815A",   // Orange
  fat: "#D4A847",     // Amber/Yellow
  fiber: "#7A9EBE",   // Blue
};

const formatNumber = (value: number) => {
  if (Number.isInteger(value)) return `${value}`;
  return value.toFixed(1);
};

// ── Glycemic Load helpers ──────────────────────────────────────────────────
const computeGlycemicLoad = (carbs: number, fiber: number, protein: number) => {
  // Estimate Glycemic Index from macro composition
  // High fiber + protein lowers effective GI. Baseline GI ~65 for mixed meal.
  const netCarbs = Math.max(0, carbs - fiber);
  const moderatingFactor = Math.max(0, 1 - (fiber / Math.max(carbs, 1)) * 0.5 - (protein / Math.max(carbs + protein, 1)) * 0.3);
  const estimatedGI = 45 + 40 * moderatingFactor; // range ~45-85
  const gl = (estimatedGI / 100) * netCarbs;
  return { gl: Math.round(gl), estimatedGI: Math.round(estimatedGI), netCarbs: Math.round(netCarbs) };
};

const getGlLevel = (gl: number): { label: string; color: string; bg: string; border: string; description: string } => {
  if (gl < 10) return { label: "Low", color: "#22C55E", bg: "#F0FDF4", border: "#BBF7D0", description: "Minimal blood sugar impact. Sustained energy." };
  if (gl < 20) return { label: "Medium", color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", description: "Moderate glucose rise. Watch portion size." };
  return { label: "High", color: "#EF4444", bg: "#FFF1F2", border: "#FECDD3", description: "Rapid glucose spike likely. Consider pairing with fiber or fat." };
};

const generateEnergyTimeline = (carbs: number, fiber: number, protein: number, fat: number) => {
  const { gl, estimatedGI } = computeGlycemicLoad(carbs, fiber, protein);
  // Baseline fasting blood glucose ~5.0 mmol/L (90 mg/dL equivalent = 100 units)
  const baseline = 100;
  // Peak rise depends on GL. High fat/protein slow absorption (lower/delayed peak)
  const peakRise = Math.min(gl * 2.2, 95); // capped at +95
  const peakDelay = fat > 20 ? 75 : protein > 30 ? 60 : 45; // minutes to peak
  const decayRate = estimatedGI > 70 ? 0.6 : estimatedGI > 55 ? 0.45 : 0.3; // faster decay = crash

  const points: { time: string; glucose: number }[] = [];
  const times = [0, 15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240];
  times.forEach((t) => {
    let glucose: number;
    if (t <= peakDelay) {
      // Rising phase
      glucose = baseline + (peakRise * (t / peakDelay));
    } else {
      // Decay phase - exponential decay back toward baseline
      const decayT = (t - peakDelay) / 60;
      glucose = baseline + peakRise * Math.exp(-decayRate * decayT);
    }
    points.push({ time: t === 0 ? "0" : t < 60 ? `${t}m` : `${t / 60}h`, glucose: Math.round(glucose) });
  });
  return { points, peakGlucose: Math.round(baseline + peakRise), baseline };
};

const getTweakCards = (carbs: number, fiber: number, protein: number, fat: number, gl: number) => {
  const tweaks: { icon: string; tip: string; impact: string }[] = [];
  if (fiber < 5) tweaks.push({ icon: "🥦", tip: "Add 1 cup of steamed broccoli or spinach", impact: "↓ GL by ~3 points" });
  if (protein < 20) tweaks.push({ icon: "🥚", tip: "Include a boiled egg or 30g of cottage cheese", impact: "↓ Glucose spike by ~15%" });
  if (fat < 8) tweaks.push({ icon: "🥑", tip: "Drizzle 1 tsp of olive oil or add ¼ avocado", impact: "Slows absorption, reduces crash" });
  if (gl > 20) tweaks.push({ icon: "💧", tip: "Drink a glass of water before eating", impact: "Delays gastric emptying by ~10min" });
  if (tweaks.length === 0) tweaks.push({ icon: "✅", tip: "Great macro balance! Minimal glucose crash risk.", impact: "No adjustments needed" });
  return tweaks.slice(0, 3);
};

const checkAllergenConflicts = (foods: string[], allergies: string[]) => {
  const conflicts: { allergen: string; ingredient: string; substitutes: string[] }[] = [];
  
  const allergyMap: Record<string, { patterns: string[]; subs: string[] }> = {
    "Shellfish": {
      patterns: ["shrimp", "prawn", "lobster", "crab", "crayfish", "mussel", "clam", "oyster", "shellfish"],
      subs: ["King oyster mushrooms", "Tofu", "Heart of palm", "Plant-based mock shrimp"]
    },
    "Eggs": {
      patterns: ["egg", "mayonnaise", "mayo", "meringue", "custard"],
      subs: ["Silken tofu", "Chickpea flour (besan)", "Flaxseed meal", "Just Egg substitute"]
    },
    "Soy": {
      patterns: ["soy", "tofu", "tempeh", "edamame", "miso", "shoyu", "tamari"],
      subs: ["Chickpeas", "Seitan", "Coconut aminos", "Pea protein"]
    },
    "Fish": {
      patterns: ["fish", "salmon", "tuna", "cod", "trout", "mackerel", "sardine", "anchovy", "halibut", "sea bass", "tilapia", "haddock"],
      subs: ["Jackfruit", "Mashed chickpeas", "Tofu", "Seaweed-wrapped heart of palm"]
    },
    "Sesame": {
      patterns: ["sesame", "tahini", "gomasio", "halvah"],
      subs: ["Sunflower seed butter", "Pumpkin seed butter", "Olive oil"]
    }
  };

  foods.forEach((food) => {
    const foodLower = food.toLowerCase();
    allergies.forEach((allergy) => {
      const config = allergyMap[allergy];
      if (config && config.patterns.some(p => foodLower.includes(p))) {
        conflicts.push({
          allergen: allergy,
          ingredient: food,
          substitutes: config.subs
        });
      }
    });
  });

  return conflicts;
};

const checkDietaryConflicts = (foods: string[], restrictions: string[]) => {
  const conflicts: { restriction: string; ingredient: string; substitutes: string[] }[] = [];
  
  const restrictionMap: Record<string, { patterns: string[]; subs: string[] }> = {
    "Vegetarian": {
      patterns: ["chicken", "beef", "pork", "mutton", "lamb", "fish", "salmon", "tuna", "cod", "shrimp", "prawn", "lobster", "crab", "bacon", "turkey", "ham", "steak", "meat"],
      subs: ["Tofu", "Paneer", "Tempeh", "Lentils", "Mushrooms"]
    },
    "Vegan": {
      patterns: ["chicken", "beef", "pork", "mutton", "lamb", "fish", "salmon", "tuna", "cod", "shrimp", "prawn", "lobster", "crab", "bacon", "turkey", "ham", "steak", "meat", "milk", "cheese", "yogurt", "butter", "ghee", "egg", "honey", "cream", "paneer", "whey"],
      subs: ["Plant-based milk (almond/soy/oat)", "Vegan cheese", "Coconut oil", "Nutritional yeast", "Tofu"]
    },
    "Gluten-Free": {
      patterns: ["wheat", "flour", "bread", "pasta", "pizza dough", "dough", "semolina", "barley", "rye"],
      subs: ["Almond flour", "Coconut flour", "Rice flour", "Quinoa", "Gluten-free oats"]
    },
    "Nut-Free": {
      patterns: ["peanut", "almond", "walnut", "cashew", "pecan", "pistachio", "macadamia", "hazelnut", "nut"],
      subs: ["Sunflower seeds", "Pumpkin seeds", "Oats", "Melon seeds (magaz)"]
    }
  };

  foods.forEach((food) => {
    const foodLower = food.toLowerCase();
    restrictions.forEach((restriction) => {
      const config = restrictionMap[restriction];
      if (config && config.patterns.some(p => foodLower.includes(p))) {
        conflicts.push({
          restriction: restriction,
          ingredient: food,
          substitutes: config.subs
        });
      }
    });
  });

  return conflicts;
};

export const ResultsPage = ({ onBack, onNavigate }: ResultsPageProps) => {
  const analysis = useUploadStore((state) => state.analysis);
  const addIngredientsToPantry = useUploadStore((state) => state.addIngredientsToPantry);
  const deductIngredientsFromPantry = useUploadStore((state) => state.deductIngredientsFromPantry);
  const pantryAnalysis = useUploadStore((state) => state.pantryAnalysis);
  
  const [isSaved, setIsSaved] = useState(false);
  const [isDeducted, setIsDeducted] = useState(false);
  const [isSimilarModalOpen, setIsSimilarModalOpen] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [allergenConflicts, setAllergenConflicts] = useState<any[]>([]);
  const [dietaryConflicts, setDietaryConflicts] = useState<any[]>([]);
  const [aiSubstitutes, setAiSubstitutes] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiSubstitutes, setShowAiSubstitutes] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    let active = true;
    const loadProfileAndCheck = async () => {
      try {
        const res = await fetchProfileRequest();
        if (!active) return;
        setProfile(res.data);
        
        if (analysis) {
          const foodNames = analysis.foods.map(f => f.name);
          const allergies = res.data.foodAllergies || [];
          const restrictions = res.data.dietaryRestrictions || [];
          
          const aConflicts = checkAllergenConflicts(foodNames, allergies);
          const dConflicts = checkDietaryConflicts(foodNames, restrictions);
          
          setAllergenConflicts(aConflicts);
          setDietaryConflicts(dConflicts);
        }
      } catch (err) {
        console.error("Failed to load profile for allergen check:", err);
      }
    };
    loadProfileAndCheck();
    return () => {
      active = false;
    };
  }, [analysis]);

  const currentPantry = useMemo(() => {
    const defaultMockNames = ["Avocados", "Chicken Breast", "Quinoa", "Greek Yogurt", "Spinach"];
    return pantryAnalysis ? pantryAnalysis.identifiedIngredients : defaultMockNames;
  }, [pantryAnalysis]);

  const matchingPantryItems = useMemo(() => {
    if (!analysis) return [];
    const scannedFoods = analysis.foods.map(f => f.name);
    return scannedFoods.filter(foodName => 
      currentPantry.some(p => 
        p.toLowerCase().includes(foodName.toLowerCase()) ||
        foodName.toLowerCase().includes(p.toLowerCase())
      )
    );
  }, [analysis, currentPantry]);

  const chartData = useMemo(() => {
    if (!analysis) return [];
    return [
      { name: "Protein", value: analysis.macros.protein || 1, color: macroColors.protein },
      { name: "Carbs", value: analysis.macros.carbs || 1, color: macroColors.carbs },
      { name: "Fat", value: analysis.macros.fat || 1, color: macroColors.fat },
    ];
  }, [analysis]);

  const totalMacros = useMemo(() => {
    if (!analysis) return 0;
    return (analysis.macros.protein || 0) + (analysis.macros.carbs || 0) + (analysis.macros.fat || 0);
  }, [analysis]);

  const macroPercentages = useMemo(() => {
    if (totalMacros === 0) return { protein: 0, carbs: 0, fat: 0 };
    return {
      protein: Math.round(((analysis?.macros.protein || 0) / totalMacros) * 100),
      carbs: Math.round(((analysis?.macros.carbs || 0) / totalMacros) * 100),
      fat: Math.round(((analysis?.macros.fat || 0) / totalMacros) * 100),
    };
  }, [analysis, totalMacros]);

  if (!analysis) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-bold text-textHeading mb-2">No analysis data</h2>
          <button onClick={onBack} className="bg-primary text-white px-4 py-2 rounded-lg">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const handleSaveToLog = () => {
    setIsSaved(true);
    alert("Saved successfully to log!");
  };

  return (
    <div className="flex-1 min-h-screen bg-background relative overflow-y-auto pb-24">
      {/* Header and Breadcrumb */}
      <header className="px-8 pt-8 pb-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2 text-xs font-semibold text-textMuted mb-6">
          <HomeIcon className="h-3.5 w-3.5" />
          <span className="cursor-pointer hover:text-textHeading" onClick={onBack}>Dashboard</span>
          <span>&gt;</span>
          <span className="text-primary font-bold">Scan Results</span>
        </div>

        <div className="flex justify-between items-center w-full">
          <div>
            <h1 className="text-3xl font-bold text-textHeading tracking-tight">Scan Results</h1>
            <p className="text-textMuted text-sm mt-1">AI-generated nutritional breakdown of your meal</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSaveToLog}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                isSaved ? "bg-emerald-600 text-white" : "bg-[#9DB89F] hover:bg-[#7A9E7E] text-white"
              }`}
            >
              <span>{isSaved ? "✓ Saved" : "Save to Log"}</span>
            </button>
            <button className="px-5 py-2.5 rounded-full bg-white border border-[#E2E4DC] hover:bg-surfaceAlt text-textHeading text-xs font-bold transition-all shadow-sm flex items-center gap-1.5">
              <ShareIcon className="w-3.5 h-3.5" /> Share
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="px-8 py-4 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-8">
        
        {/* Left Column: Image and Macro breakdown */}
        <div className="space-y-6">
          
          {/* Scanned Image Card */}
          <div className="relative rounded-[24px] overflow-hidden border border-border bg-white shadow-sm">
            <img 
              src={analysis.imageUrl} 
              alt="Scanned Food" 
              onError={(e) => handleImageError(e, analysis.foods[0]?.name || "Meal")}
              className="w-full h-80 object-cover"
            />
            {/* Translucent Banner */}
            <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-bold text-[#2C3E2B] flex items-center gap-1.5 shadow-sm">
              <span className="animate-pulse w-2 h-2 rounded-full bg-[#7A9E7E]"></span>
              AI Analysis Active
            </div>
          </div>

          {/* Nutritional Breakdown Card */}
          <section className="bg-white rounded-[24px] border border-border p-6 shadow-sm">
            <h2 className="text-xl font-bold text-textHeading mb-6">Nutritional Breakdown</h2>
            
            {/* Macro Pill Boxes */}
            <div className="grid grid-cols-4 gap-3 mb-8">
              <div className="bg-[#FEF0EB] rounded-2xl p-3 border border-[#FEE2D5] text-center">
                <div className="text-xs font-bold text-[#E8815A]">{formatNumber(analysis.macros.calories)} kcal</div>
              </div>
              <div className="bg-[#EBF2EB] rounded-2xl p-3 border border-[#D4E6D5] text-center">
                <div className="text-xs font-bold text-[#7A9E7E]">{formatNumber(analysis.macros.protein)}g Protein</div>
              </div>
              <div className="bg-[#FEF9EB] rounded-2xl p-3 border border-[#FDF0CD] text-center">
                <div className="text-xs font-bold text-[#D4A847]">{formatNumber(analysis.macros.carbs)}g Carbs</div>
              </div>
              <div className="bg-[#F5F6F1] rounded-2xl p-3 border border-[#E2E4DC] text-center">
                <div className="text-xs font-bold text-textHeading">{formatNumber(analysis.macros.fat)}g Fats</div>
              </div>
            </div>

            {/* Macronutrient Ratio Chart */}
            <div className="text-center font-bold text-xs text-textMuted uppercase tracking-wider mb-4">Macronutrient Ratio</div>
            <div className="flex flex-col md:flex-row items-center justify-around gap-6">
              
              <div className="relative w-44 h-44 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={chartData} 
                      cx="50%" 
                      cy="50%" 
                      dataKey="value" 
                      innerRadius={50} 
                      outerRadius={75} 
                      paddingAngle={3} 
                      stroke="none"
                    >
                      {chartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-textHeading">{formatNumber(analysis.macros.calories)}</span>
                  <span className="text-[10px] text-textMuted font-bold uppercase">Total kcal</span>
                </div>
              </div>

              {/* Legends with Percentages */}
              <div className="space-y-4 w-full max-w-xs">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#9DB89F]"></span>
                    <span className="text-sm font-semibold text-textHeading">Protein</span>
                  </div>
                  <span className="text-sm font-bold text-textHeading">{macroPercentages.protein}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#E8815A]"></span>
                    <span className="text-sm font-semibold text-textHeading">Carbs</span>
                  </div>
                  <span className="text-sm font-bold text-textHeading">{macroPercentages.carbs}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#D4A847]"></span>
                    <span className="text-sm font-semibold text-textHeading">Fats</span>
                  </div>
                  <span className="text-sm font-bold text-textHeading">{macroPercentages.fat}%</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Feature 2: Glycemic Load & Energy Crash Predictor ── */}
          {(() => {
            const carbs = analysis.macros.carbs || 0;
            const fiber = analysis.macros.fiber || 0;
            const protein = analysis.macros.protein || 0;
            const fat = analysis.macros.fat || 0;
            const { gl, netCarbs, estimatedGI } = computeGlycemicLoad(carbs, fiber, protein);
            const glLevel = getGlLevel(gl);
            const { points, peakGlucose, baseline } = generateEnergyTimeline(carbs, fiber, protein, fat);
            const tweaks = getTweakCards(carbs, fiber, protein, fat, gl);
            const glPercent = Math.min((gl / 35) * 100, 100); // 35 = very high GL threshold

            return (
              <section className="bg-white rounded-[24px] border border-border p-6 shadow-sm space-y-6">
                {/* Section Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-textHeading flex items-center gap-2">
                      <span>⚡</span> Glycemic Load
                    </h2>
                    <p className="text-xs text-textMuted mt-0.5">Estimated blood sugar impact of this meal</p>
                  </div>
                  <div
                    className="px-3 py-1.5 rounded-full text-xs font-extrabold"
                    style={{ background: glLevel.bg, border: `1px solid ${glLevel.border}`, color: glLevel.color }}
                  >
                    {glLevel.label} GL
                  </div>
                </div>

                {/* GL Gauge */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-bold text-textMuted">
                    <span>0</span>
                    <span className="text-center">GL Score: <span style={{ color: glLevel.color }} className="text-base font-extrabold">{gl}</span></span>
                    <span>35+</span>
                  </div>
                  <div className="relative h-3 bg-gradient-to-r from-green-200 via-amber-200 to-red-300 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 h-full w-1.5 bg-white border border-gray-400 rounded-full shadow-md transition-all duration-700"
                      style={{ left: `calc(${glPercent}% - 3px)` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-semibold text-textMuted">
                    <span className="text-green-600">Low (&lt;10)</span>
                    <span className="text-amber-500">Medium (10–19)</span>
                    <span className="text-red-500">High (≥20)</span>
                  </div>
                  <p className="text-[11px] text-textMuted mt-1 leading-relaxed" style={{ color: glLevel.color + "CC" }}>
                    {glLevel.description}
                  </p>
                  <div className="flex gap-3 text-[10px] text-textMuted flex-wrap pt-1">
                    <span className="bg-[#F5F6F1] px-2 py-0.5 rounded-full border border-border font-semibold">Net Carbs: {netCarbs}g</span>
                    <span className="bg-[#F5F6F1] px-2 py-0.5 rounded-full border border-border font-semibold">Est. GI: ~{estimatedGI}</span>
                    <span className="bg-[#F5F6F1] px-2 py-0.5 rounded-full border border-border font-semibold">Peak: ~{peakGlucose} mg/dL</span>
                  </div>
                </div>

                {/* Energy Timeline Chart */}
                <div>
                  <div className="text-xs font-bold text-textHeading mb-1">4-Hour Blood Glucose Forecast</div>
                  <p className="text-[10px] text-textMuted mb-3">Projected relative blood sugar curve after eating</p>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={points} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
                        <defs>
                          <linearGradient id="glucoseGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#22C55E" />
                            <stop offset="50%" stopColor={glLevel.color} />
                            <stop offset="100%" stopColor="#22C55E" />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#888888", fontSize: 9 }} />
                        <YAxis hide domain={[80, 'auto']} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const val = payload[0].value as number;
                              const change = val - baseline;
                              return (
                                <div className="bg-white border border-border rounded-xl p-2.5 shadow-md text-[10px]">
                                  <p className="font-bold text-textHeading">~{val} mg/dL</p>
                                  <p className={`font-semibold ${change > 0 ? 'text-amber-500' : 'text-green-500'}`}>
                                    {change >= 0 ? `+${change}` : change} from baseline
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine y={baseline} stroke="#D4E6D5" strokeDasharray="4 4" strokeWidth={1.5} />
                        <ReferenceLine y={140} stroke="#FDE68A" strokeDasharray="3 3" strokeWidth={1} label={{ value: 'spike', position: 'right', fontSize: 8, fill: '#F59E0B' }} />
                        <Line
                          type="monotone"
                          dataKey="glucose"
                          stroke={`url(#glucoseGradient)`}
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 4, fill: glLevel.color, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-[9px] text-textMuted">
                    <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-[#D4E6D5] inline-block" /> Fasting baseline</span>
                    <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-[#FDE68A] inline-block" /> Spike threshold</span>
                  </div>
                </div>

                {/* Tweak Cards */}
                <div>
                  <div className="text-xs font-bold text-textHeading mb-2">💡 Balance Tips</div>
                  <div className="space-y-2">
                    {tweaks.map((t, i) => (
                      <div key={i} className="flex items-start gap-3 bg-[#F8FAF8] border border-[#E2E8E2] rounded-xl p-3">
                        <span className="text-base mt-0.5">{t.icon}</span>
                        <div>
                          <p className="text-[11px] font-semibold text-textHeading leading-tight">{t.tip}</p>
                          <p className="text-[10px] text-[#7A9E7E] font-bold mt-0.5">{t.impact}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          })()}
        </div>

        {/* Right Column: Detected Items & Insights */}
        <div className="space-y-6">
          
          {/* Allergen & Dietary Alert Card */}
          {(allergenConflicts.length > 0 || dietaryConflicts.length > 0) && (
            <section className="bg-rose-50/95 border border-rose-200 rounded-[24px] p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xl animate-pulse">⚠️</span>
                <div>
                  <h3 className="font-extrabold text-rose-900 text-base">Allergen &amp; Dietary Alert</h3>
                  <p className="text-xs text-rose-700/80">We detected ingredients that conflict with your preferences.</p>
                </div>
              </div>

              <div className="space-y-3.5">
                {allergenConflicts.map((c, idx) => (
                  <div key={`all-${idx}`} className="bg-white/80 rounded-xl p-3.5 border border-rose-100/60">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-bold text-rose-900 capitalize">⚠️ {c.ingredient}</span>
                      <span className="text-[10px] font-extrabold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full uppercase tracking-wider">Allergy: {c.allergen}</span>
                    </div>
                    <div className="text-xs text-textBody">
                      <span className="font-semibold text-textHeading">Recommended Swaps:</span>{" "}
                      {c.substitutes.join(", ")}
                    </div>
                  </div>
                ))}

                {dietaryConflicts.map((c, idx) => (
                  <div key={`diet-${idx}`} className="bg-white/80 rounded-xl p-3.5 border border-rose-100/60">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-bold text-rose-900 capitalize">⚠️ {c.ingredient}</span>
                      <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full uppercase tracking-wider">{c.restriction}</span>
                    </div>
                    <div className="text-xs text-textBody">
                      <span className="font-semibold text-textHeading">Recommended Swaps:</span>{" "}
                      {c.substitutes.join(", ")}
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Substitutes Button */}
              {!showAiSubstitutes ? (
                <button
                  onClick={async () => {
                    setIsAiLoading(true);
                    setAiError("");
                    try {
                      const foodNames = analysis.foods.map(f => f.name);
                      const res = await fetchAllergenSubstitutesRequest(
                        foodNames,
                        profile?.foodAllergies || [],
                        profile?.dietaryRestrictions || []
                      );
                      setAiSubstitutes(res.data || []);
                      setShowAiSubstitutes(true);
                    } catch (err) {
                      setAiError("Could not retrieve AI substitutes. Please try again.");
                    } finally {
                      setIsAiLoading(false);
                    }
                  }}
                  disabled={isAiLoading}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 hover:scale-[1.01] active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  {isAiLoading ? "Consulting AI Chef..." : "✨ Generate Chef-Crafted Swaps (AI)"}
                </button>
              ) : (
                <div className="bg-white rounded-2xl p-4 border border-rose-100 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-[#F5F5F0]">
                    <span className="text-xs font-bold text-textHeading flex items-center gap-1">🍳 Chef AI Swaps</span>
                    <button 
                      onClick={() => setShowAiSubstitutes(false)}
                      className="text-textMuted hover:text-textHeading text-xs font-bold"
                    >
                      Hide
                    </button>
                  </div>

                  {aiSubstitutes.length === 0 ? (
                    <p className="text-xs text-textMuted italic">No custom swaps generated.</p>
                  ) : (
                    <div className="space-y-3">
                      {aiSubstitutes.map((swap: any, idx: number) => (
                        <div key={`swap-${idx}`} className="space-y-1">
                          <div className="text-xs font-bold text-rose-700 capitalize">
                            Replace: {swap.ingredient}
                          </div>
                          <p className="text-[11px] text-textMuted leading-relaxed">{swap.reason}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {swap.substitutes?.map((s: string, sIdx: number) => (
                              <span key={sIdx} className="text-[10px] font-semibold bg-[#EBF2EB] border border-[#D4E6D5] text-[#2C3E2B] px-2 py-0.5 rounded-full">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {aiError && (
                <p className="text-xs font-semibold text-rose-600 text-center">{aiError}</p>
              )}
            </section>
          )}

          {/* Detected Items Card */}
          <section className="bg-white rounded-[24px] border border-border p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-textHeading">Detected Items</h2>
              <span className="text-xs font-bold text-[#888888] bg-[#F5F5F0] px-2.5 py-1 rounded-full border border-border">
                {analysis.foods.length} items
              </span>
            </div>

            <div className="space-y-4">
              {analysis.foods.map((food, index) => {
                const category = foodCategories[food.name] ?? "Ingredient";
                const mockWeights = ["180g", "100g", "120g", "15ml"];
                const weight = mockWeights[index % mockWeights.length];
                return (
                  <div key={food.name} className="flex justify-between items-center pb-4 border-b border-[#F5F5F0] last:border-b-0 last:pb-0">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full bg-[#F5F6F1] border border-border flex items-center justify-center font-bold text-xs text-[#7A9E7E]">
                        {food.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-textHeading text-sm capitalize">{food.name}</h4>
                        <p className="text-xs text-[#10B981] font-semibold mt-0.5">{(food.confidence * 100).toFixed(0)}% match</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-textHeading">{weight}</span>
                  </div>
                );
              })}
            </div>

            <button className="w-full mt-6 py-2.5 bg-white border border-[#E2E4DC] hover:border-primary text-textMuted hover:text-primary rounded-xl text-xs font-bold transition-all shadow-sm">
              Edit Ingredients
            </button>
          </section>

          {/* NutriTrack Insight Card */}
          <section className="bg-[#EBF2EB] border border-[#D4E6D5] rounded-[24px] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <h3 className="font-bold text-[#2C3E2B] text-base">Nutrixa Insight</h3>
            </div>
            <p className="text-sm text-textBody leading-relaxed">
              This meal is high in Omega-3 fatty acids and lean protein. It covers 65% of your daily Vitamin D requirement.
            </p>
            {/* Advice sub-block */}
            <div className="bg-white rounded-xl p-4 border border-[#D4E6D5]/60 flex items-start gap-2.5">
              <span className="text-base text-yellow-500 mt-0.5">💡</span>
              <p className="text-xs text-textBody leading-relaxed">
                Pair with a glass of water to aid digestion of high-fiber grains.
              </p>
            </div>
          </section>

          {/* Quick Actions Shortcuts */}
          <div className={`grid gap-4 ${matchingPantryItems.length > 0 ? "grid-cols-3" : "grid-cols-2"}`}>
            <button 
              onClick={() => {
                if (!analysis) return;
                const ingredients = analysis.foods.map(f => f.name);
                addIngredientsToPantry(ingredients);
                alert(`Added ${ingredients.join(", ")} to your Pantry inventory!`);
                onNavigate?.("/pantry");
              }}
              className="bg-white hover:bg-surfaceAlt border border-border rounded-2xl p-4 text-center hover:shadow-md transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-full bg-[#EBF2EB] border border-[#D4E6D5] flex items-center justify-center text-[#7A9E7E]">
                🛒
              </div>
              <span className="text-xs font-bold text-textHeading">Add to Pantry</span>
            </button>
            <button 
              onClick={() => setIsSimilarModalOpen(true)}
              className="bg-white hover:bg-surfaceAlt border border-border rounded-2xl p-4 text-center hover:shadow-md transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-full bg-[#FEF9EB] border border-[#FDF0CD] flex items-center justify-center text-[#D4A847]">
                📖
              </div>
              <span className="text-xs font-bold text-textHeading">Similar Recipes</span>
            </button>

            {matchingPantryItems.length > 0 && (
              <button 
                onClick={() => {
                  if (isDeducted) return;
                  deductIngredientsFromPantry(matchingPantryItems);
                  setIsDeducted(true);
                  alert(`Deducted ${matchingPantryItems.join(", ")} from your Pantry stock!`);
                }}
                disabled={isDeducted}
                className={`border rounded-2xl p-4 text-center transition-all flex flex-col items-center justify-center gap-2 group ${
                  isDeducted 
                    ? "bg-[#FEF0EB]/60 border-[#FEE2D5] text-[#E8815A]" 
                    : "bg-white hover:bg-surfaceAlt border-border hover:shadow-md cursor-pointer"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isDeducted 
                    ? "bg-[#FEE2D5] text-[#E8815A]" 
                    : "bg-[#FEF0EB] border border-[#FEE2D5] text-[#E8815A]"
                }`}>
                  {isDeducted ? "✓" : "🥣"}
                </div>
                <span className="text-xs font-bold">
                  {isDeducted ? "Deducted Stock" : `Deduct (${matchingPantryItems.length}) Stock`}
                </span>
              </button>
            )}
          </div>

        </div>
      </main>

      {/* Sticky Action Button for New Scan */}
      <button 
        onClick={onBack}
        className="fixed bottom-8 right-8 flex items-center gap-2 px-6 py-3.5 bg-[#9DB89F] hover:bg-[#7A9E7E] text-white rounded-full font-bold shadow-lg shadow-[#9DB89F]/30 hover:scale-105 active:scale-95 transition-all z-20"
      >
        <PlusIcon className="w-5 h-5" />
        <span>New Analysis</span>
      </button>

      {/* Similar Recipes Modal Overlay */}
      {isSimilarModalOpen && analysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-panel border border-panelBorder rounded-[32px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col animate-slide-up p-6 md:p-8">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-textHeading capitalize">
                  📖 Similar Recipes
                </h2>
                <p className="text-xs text-textMuted mt-1">
                  Healthy alternatives matching {analysis.foods[0]?.name || "scanned food"}
                </p>
              </div>
              <button
                onClick={() => setIsSimilarModalOpen(false)}
                className="bg-surfaceAlt hover:bg-border text-textHeading font-bold w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm text-xs"
              >
                ✕
              </button>
            </div>

            {/* Recipes Stack */}
            <div className="space-y-4 overflow-y-auto max-h-[55vh] pr-1 custom-scrollbar mb-6">
              {(() => {
                const foodName = analysis.foods[0]?.name || "Meal";
                const recipes = foodName.toLowerCase().includes("bhaji") || foodName.toLowerCase().includes("curry") || foodName.toLowerCase().includes("vegetable")
                  ? [
                      {
                        name: "Paneer Butter Masala",
                        prepTime: "25 min",
                        calories: 380,
                        protein: 14,
                        carbs: 12,
                        fat: 30,
                        ingredients: ["Paneer (Cottage Cheese)", "Tomato Purée", "Butter", "Heavy Cream", "Indian Spices"],
                        instructions: ["Sauté spices and garlic in butter.", "Add tomato purée and simmer.", "Add paneer cubes and cream, then cook for 5 mins."]
                      },
                      {
                        name: "Aloo Gobi Matar",
                        prepTime: "20 min",
                        calories: 210,
                        protein: 5,
                        carbs: 28,
                        fat: 8,
                        ingredients: ["Potatoes", "Cauliflower", "Green Peas", "Ginger-Garlic Paste", "Turmeric"],
                        instructions: ["Parboil potatoes and cauliflower.", "Sauté onion, ginger, and spices.", "Add peas and vegetables, cover and cook until tender."]
                      },
                      {
                        name: "Dal Makhani",
                        prepTime: "40 min",
                        calories: 320,
                        protein: 12,
                        carbs: 38,
                        fat: 12,
                        ingredients: ["Black Lentils (Urad Dal)", "Kidney Beans (Rajma)", "Butter", "Tomato Paste", "Cream"],
                        instructions: ["Pressure cook soaked lentils and beans.", "Simmer with butter and tomato paste for 30 mins.", "Stir in cream and spices before serving."]
                      }
                    ]
                  : foodName.toLowerCase().includes("quinoa") || foodName.toLowerCase().includes("salad") || foodName.toLowerCase().includes("bowl")
                  ? [
                      {
                        name: "Zesty Chickpea Salad",
                        prepTime: "10 min",
                        calories: 290,
                        protein: 11,
                        carbs: 35,
                        fat: 12,
                        ingredients: ["Chickpeas", "Cucumbers", "Cherry Tomatoes", "Olive Oil", "Lemon Dressing"],
                        instructions: ["Rinse and drain chickpeas.", "Chop cucumbers and tomatoes.", "Toss everything with olive oil and lemon dressing."]
                      },
                      {
                        name: "Avocado & Egg Salad",
                        prepTime: "12 min",
                        calories: 340,
                        protein: 14,
                        carbs: 8,
                        fat: 28,
                        ingredients: ["Avocados", "Boiled Eggs", "Greek Yogurt", "Chives", "Lemon juice"],
                        instructions: ["Chop boiled eggs and avocados.", "Mash avocado slightly with Greek yogurt and lemon juice.", "Combine with eggs and top with chives."]
                      },
                      {
                        name: "Tofu Quinoa Buddha Bowl",
                        prepTime: "20 min",
                        calories: 410,
                        protein: 18,
                        carbs: 48,
                        fat: 16,
                        ingredients: ["Quinoa", "Firm Tofu", "Roasted Broccoli", "Tahini Sauce", "Sesame Seeds"],
                        instructions: ["Cook quinoa. Pan-fry cubed tofu.", "Roast broccoli florets with salt.", "Assemble bowl and drizzle with tahini dressing."]
                      }
                    ]
                  : [
                      {
                        name: `Healthy Homemade ${foodName}`,
                        prepTime: "15 min",
                        calories: Math.round(analysis.macros.calories * 0.8) || 320,
                        protein: Math.round(analysis.macros.protein) || 15,
                        carbs: Math.round(analysis.macros.carbs * 0.9) || 35,
                        fat: Math.round(analysis.macros.fat * 0.7) || 12,
                        ingredients: ["Fresh organic produce", "Olive oil", "Low-sodium seasoning", "Whole grains"],
                        instructions: ["Prep all ingredients by washing and chopping.", "Sauté with light oil and seasoning.", "Portion and enjoy immediately."]
                      },
                      {
                        name: `Low Carb ${foodName} Alternative`,
                        prepTime: "20 min",
                        calories: Math.round(analysis.macros.calories * 0.65) || 260,
                        protein: Math.round(analysis.macros.protein * 1.1) || 18,
                        carbs: Math.round(analysis.macros.carbs * 0.4) || 15,
                        fat: Math.round(analysis.macros.fat * 0.8) || 14,
                        ingredients: ["Cauliflower substitute", "Lean proteins", "Avocado oil", "Herbs & Spices"],
                        instructions: ["Substitute refined carbs with veggies.", "Cook proteins thoroughly in a hot skillet.", "Garnish with fresh herbs."]
                      }
                    ];

                return recipes.map((recipe, index) => (
                  <div key={index} className="bg-white border border-border rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-textHeading text-sm capitalize">{recipe.name}</h3>
                      <span className="text-[10px] bg-[#EBF2EB] text-[#7A9E7E] px-2 py-0.5 rounded-full font-bold">
                        ⏱ {recipe.prepTime}
                      </span>
                    </div>
                    
                    {/* Macros */}
                    <div className="grid grid-cols-4 gap-2 bg-[#F5F6F1] p-2 rounded-xl text-center text-[10px]">
                      <div>
                        <span className="font-bold text-textHeading">{recipe.calories}</span>
                        <span className="text-[8px] text-textMuted block font-bold uppercase">kcal</span>
                      </div>
                      <div>
                        <span className="font-bold text-[#E8815A]">{recipe.protein}g</span>
                        <span className="text-[8px] text-textMuted block font-bold uppercase">prot</span>
                      </div>
                      <div>
                        <span className="font-bold text-[#D4A847]">{recipe.carbs}g</span>
                        <span className="text-[8px] text-textMuted block font-bold uppercase">carb</span>
                      </div>
                      <div>
                        <span className="font-bold text-[#7A9E7E]">{recipe.fat}g</span>
                        <span className="text-[8px] text-textMuted block font-bold uppercase">fat</span>
                      </div>
                    </div>

                    {/* Ingredients list summary */}
                    <div className="text-[10px] text-textMuted leading-relaxed">
                      <span className="font-bold text-textHeading">Key Ingredients:</span> {recipe.ingredients.join(", ")}
                    </div>
                    
                    <button 
                      onClick={() => {
                        alert(`Successfully added ${recipe.name} to your Daily Diet Plan!`);
                        setIsSimilarModalOpen(false);
                        onNavigate?.("/diet-plan");
                      }}
                      className="w-full py-1.5 bg-[#9DB89F] hover:bg-[#7A9E7E] text-white text-[10px] font-bold rounded-lg transition-colors mt-2"
                    >
                      Add to Diet Plan
                    </button>
                  </div>
                ));
              })()}
            </div>

            <button
              onClick={() => setIsSimilarModalOpen(false)}
              className="w-full py-3 bg-[#E2E4DC] hover:bg-[#D4D6CC] text-textHeading rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Close Recipes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
