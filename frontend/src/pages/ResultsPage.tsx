import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import {
  BreadcrumbChevronIcon,
  CameraIcon,
  ChartBarsIcon,
  CodeBracketsIcon,
  CopyIcon,
  FileIcon,
  HeartIcon,
  HistoryIcon,
  HomeIcon,
  InfoIcon,
  MacroChartIcon,
  OverviewIcon,
  PlusIcon,
  RulerIcon,
  ScaleIcon,
  ShareIcon,
  TableIcon,
  UserIcon,
} from "../components/icons";
import { useUploadStore } from "../store/uploadStore";
import { correctIngredientRequest } from "../services/uploadApi";

type ResultsPageProps = {
  onBack: () => void;
  onNavigate: (nextPath: string) => void;
};

type ExportFormat = "PDF" | "CSV" | "JSON";
type QuickAction = {
  description: string;
  icon: typeof CameraIcon;
  onClick?: () => void | Promise<void>;
  title: string;
};

const foodCategories: Record<string, string> = {
  "Grilled Chicken": "Lean Protein",
  "Brown Rice": "Whole Grains",
  "Steamed Broccoli": "Vegetables",
  Lettuce: "Leafy Greens",
  Tomatoes: "Vegetables",
  Cucumber: "Vegetables",
  Carrots: "Root Vegetables",
};

const macroColors = {
  carbs: "#FF9A3D",
  fat: "#38D39C",
  fiber: "#8794FF",
  protein: "#FF7A12",
};

const formatNumber = (value: number) => {
  if (Number.isInteger(value)) {
    return `${value}`;
  }
  return value.toFixed(2);
};

const truncateTitle = (value: string) => (value.length > 11 ? `${value.slice(0, 10)}...` : value);

const renderPieLabel = ({ cx, cy, innerRadius, outerRadius, midAngle, name }: any) => {
  if (cx === undefined || cy === undefined || innerRadius === undefined || outerRadius === undefined || midAngle === undefined || !name) {
    return null;
  }

  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
  const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

  return (
    <text dominantBaseline="central" fill="#FFFFFF" fontSize="12" fontWeight="bold" textAnchor="middle" x={x} y={y}>
      {name}
    </text>
  );
};

export const ResultsPage = ({ onBack, onNavigate }: ResultsPageProps) => {
  const analysis = useUploadStore((state) => state.analysis);
  const setAnalysis = useUploadStore((state) => state.setAnalysis);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("JSON");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [editingFoodName, setEditingFoodName] = useState<string | null>(null);
  const [correctedFoodValue, setCorrectedFoodValue] = useState<string>("");
  const [isCorrecting, setIsCorrecting] = useState<boolean>(false);

  const handleCorrectIngredient = async (originalName: string) => {
    if (!correctedFoodValue.trim() || correctedFoodValue === originalName) {
      setEditingFoodName(null);
      return;
    }

    setIsCorrecting(true);
    try {
      if (!analysis) return;
      const response = await correctIngredientRequest(analysis.id, originalName, correctedFoodValue.trim());
      setAnalysis(response.data);
      setStatusMessage(`Successfully learned: "${originalName}" is actually "${response.data.foods.find((f: any) => f.confidence === 1.0)?.name || correctedFoodValue}". Nutritional values instantly updated!`);
      setEditingFoodName(null);
    } catch (err) {
      setStatusMessage("Failed to save correction.");
    } finally {
      setIsCorrecting(false);
    }
  };

  const chartData = useMemo(
    () =>
      analysis
        ? [
            { name: "Protein", value: analysis.macros.protein, color: macroColors.protein },
            { name: "Carbs", value: analysis.macros.carbs, color: macroColors.carbs },
            { name: "Fat", value: analysis.macros.fat, color: macroColors.fat },
            { name: "Fiber", value: analysis.macros.fiber, color: macroColors.fiber },
          ]
        : [],
    [analysis],
  );

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = (format: ExportFormat) => {
    if (!analysis) return;
    setSelectedFormat(format);

    if (format === "JSON") {
      downloadFile(`nutrivision-analysis-${analysis.id}.json`, JSON.stringify(analysis, null, 2), "application/json");
      setStatusMessage("JSON export downloaded.");
      return;
    }

    if (format === "CSV") {
      const csv = [
        "metric,value",
        `calories,${analysis.macros.calories}`,
        `protein,${analysis.macros.protein}`,
        `carbs,${analysis.macros.carbs}`,
        `fat,${analysis.macros.fat}`,
        `fiber,${analysis.macros.fiber}`,
        `volume,${analysis.volume}`,
        `weight,${analysis.weight}`,
        ...analysis.foods.map((food, index) => `food_${index + 1},${food.name} (${food.confidence})`),
      ].join("\n");
      downloadFile(`nutrivision-analysis-${analysis.id}.csv`, csv, "text/csv;charset=utf-8");
      setStatusMessage("CSV export downloaded.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=1200");
    if (!printWindow) {
      setStatusMessage("Pop-up blocked. Please allow pop-ups to export PDF.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>NutriVision Analysis</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
            h1 { margin-bottom: 16px; }
            h2 { margin-top: 28px; }
            .row { margin: 8px 0; }
          </style>
        </head>
        <body>
          <h1>Nutritional Analysis Results</h1>
          <div class="row">Calories: ${analysis.macros.calories} kcal</div>
          <div class="row">Protein: ${analysis.macros.protein} g</div>
          <div class="row">Carbohydrates: ${analysis.macros.carbs} g</div>
          <div class="row">Fat: ${analysis.macros.fat} g</div>
          <div class="row">Fiber: ${analysis.macros.fiber} g</div>
          <div class="row">Volume: ${analysis.volume} cm³</div>
          <div class="row">Weight: ${analysis.weight} g</div>
          <h2>Detected Food Items</h2>
          ${analysis.foods.map((food) => `<div class="row">${food.name} - ${(food.confidence * 100).toFixed(1)}%</div>`).join("")}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    setStatusMessage("PDF export opened in print dialog.");
  };

  const handleShare = async () => {
    if (!analysis) return;
    const shareText = `NutriVision analysis: ${analysis.macros.calories} kcal, ${analysis.macros.protein}g protein, ${analysis.macros.carbs}g carbs, ${analysis.macros.fat}g fat, ${analysis.macros.fiber}g fiber.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "NutriVision Analysis Results", text: shareText });
        setStatusMessage("Results shared.");
        return;
      }
      await navigator.clipboard.writeText(shareText);
      setStatusMessage("Share text copied to clipboard.");
    } catch {
      setStatusMessage("Share failed. Please try again.");
    }
  };

  const handleCopy = async () => {
    if (!analysis) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(analysis, null, 2));
      setStatusMessage("Analysis data copied to clipboard.");
    } catch {
      setStatusMessage("Copy failed. Please try again.");
    }
  };

  const quickActions: QuickAction[] = [
    { description: "Upload new food", icon: CameraIcon, title: truncateTitle("Analyze Another"), onClick: onBack },
    { description: "View recommendations", icon: HeartIcon, title: truncateTitle("Health Insights"), onClick: () => onNavigate("/insights") },
    { description: "Preferences", icon: UserIcon, title: truncateTitle("Update Profile"), onClick: () => onNavigate("/profile") },
    { description: "With friends", icon: ShareIcon, title: truncateTitle("Share Results"), onClick: handleShare },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-5xl mx-auto pb-24">
          
          <div className="flex items-center gap-2 text-xs font-medium text-textMuted mb-8">
            <HomeIcon className="h-4 w-4" />
            <button className="hover:text-textMain transition-colors" type="button" onClick={onBack}>
              Dashboard
            </button>
            <BreadcrumbChevronIcon className="h-3 w-3" />
            <span className="text-primary">Analysis Results</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-textMain">Nutritional Analysis Results</h1>
              <p className="mt-2 text-sm text-textMuted max-w-2xl">
                Comprehensive breakdown of your food&apos;s nutritional content and health insights
              </p>
              {analysis && (analysis.mealCategory || analysis.mealType) && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {analysis.mealCategory && analysis.mealCategory !== "meal" && (
                    <span className="capitalize text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
                      🍽 {analysis.mealCategory}
                    </span>
                  )}
                  {analysis.mealType && analysis.mealType !== "unknown" && (
                    <span className="capitalize text-xs font-semibold bg-panel border border-panelBorder text-textMuted px-3 py-1 rounded-full">
                      🕐 {analysis.mealType}
                    </span>
                  )}
                  {analysis.volumeSource && (
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                      analysis.volumeSource === "midas"
                        ? "bg-purple-900/20 border-purple-700/40 text-purple-300"
                        : "bg-panel border-panelBorder text-textMuted"
                    }`}>
                      📐 Volume: {analysis.volumeSource === "midas" ? "MiDaS depth" : "density estimate"}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
                type="button"
                onClick={onBack}
              >
                <CameraIcon className="h-4 w-4" /> Analyze New
              </button>
              <button
                className="flex items-center gap-2 rounded-lg bg-panel border border-panelBorder px-4 py-2 text-sm font-medium text-textMain hover:bg-panelBorder/50 transition-colors"
                type="button"
                onClick={() => onNavigate("/history")}
              >
                <HistoryIcon className="h-4 w-4" /> History
              </button>
            </div>
          </div>

          <div className="flex gap-3 mb-8">
            <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm" type="button">
              <OverviewIcon className="h-4 w-4" /> Overview
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-panel border border-panelBorder px-4 py-2.5 text-sm font-medium text-textMain hover:bg-panelBorder/50 transition-colors" type="button">
              <ChartBarsIcon className="h-4 w-4" /> Detailed Nutrition
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-panel border border-panelBorder px-4 py-2.5 text-sm font-medium text-textMain hover:bg-panelBorder/50 transition-colors" type="button" onClick={() => onNavigate("/insights")}>
              <HeartIcon className="h-4 w-4 text-purple-400" /> Health Insights
            </button>
          </div>

          {!analysis ? (
            <section className="rounded-2xl border border-panelBorder bg-panel p-12 text-center">
              <h2 className="text-xl font-bold text-textMain">No analysis data available</h2>
              <p className="mt-2 text-sm text-textMuted max-w-md mx-auto">
                Upload a food image first to view nutritional analysis results.
              </p>
              <button
                className="mt-6 mx-auto flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
                type="button"
                onClick={onBack}
              >
                Back to Dashboard
              </button>
            </section>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <section className="rounded-2xl border border-panelBorder bg-panel p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-900/30 text-primary">
                      <CameraIcon className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-bold text-textMain">Food Detection Results</h2>
                  </div>

                  <img
                    alt="Uploaded food"
                    className="h-64 w-full rounded-xl object-cover mb-6 border border-panelBorder"
                    src={analysis.imageUrl}
                  />

                  <h3 className="text-sm font-semibold text-textMuted uppercase tracking-wider mb-4">Detected Items</h3>

                  <div className="space-y-4 mb-6">
                    {analysis.foods.map((food) => {
                      const macros = analysis.ingredientsMacros?.[food.name.toLowerCase()];

                      return (
                        <div key={food.name} className="flex flex-col p-4 rounded-xl bg-background border border-panelBorder">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1 mr-4">
                              {editingFoodName === food.name ? (
                                <div className="flex items-center gap-2">
                                  <input 
                                    autoFocus
                                    type="text" 
                                    className="bg-panel border border-panelBorder rounded px-2 py-1 text-sm text-textMain focus:outline-none focus:border-primary flex-1"
                                    value={correctedFoodValue}
                                    onChange={(e) => setCorrectedFoodValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleCorrectIngredient(food.name);
                                      if (e.key === 'Escape') setEditingFoodName(null);
                                    }}
                                    disabled={isCorrecting}
                                  />
                                  <button 
                                    onClick={() => handleCorrectIngredient(food.name)}
                                    className="text-xs font-bold bg-primary text-white px-2 py-1 rounded hover:bg-orange-600 disabled:opacity-50"
                                    disabled={isCorrecting}
                                  >
                                    Save
                                  </button>
                                  <button 
                                    onClick={() => setEditingFoodName(null)}
                                    className="text-xs font-bold bg-panelBorder text-textMuted px-2 py-1 rounded hover:text-textMain disabled:opacity-50"
                                    disabled={isCorrecting}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 group">
                                  <div className="text-base font-bold text-textMain capitalize">{food.name}</div>
                                  <button 
                                    onClick={() => {
                                      setEditingFoodName(food.name);
                                      setCorrectedFoodValue(food.name);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-textMuted border border-panelBorder rounded px-1.5 py-0.5 hover:text-primary hover:border-primary"
                                    title="Correct this ingredient"
                                  >
                                    ✎ Edit
                                  </button>
                                </div>
                              )}
                              <div className="text-xs text-textMuted mt-0.5">
                                {foodCategories[food.name] ?? "Detected Ingredient"}
                                {macros?.portionWeight ? (
                                  <span className="ml-2 text-primary font-medium">~{macros.portionWeight}g portion</span>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded-md">
                                {(food.confidence * 100).toFixed(1)}% Match
                              </div>
                              {macros?.caloriesPerGram !== undefined && (
                                <div className="text-[10px] font-semibold text-primary/80 bg-primary/10 px-2 py-0.5 rounded-md">
                                  {macros.caloriesPerGram.toFixed(2)} kcal/g
                                </div>
                              )}
                            </div>
                          </div>
                          {macros && (
                            <div className="grid grid-cols-4 gap-2 mt-2 pt-3 border-t border-panelBorder">
                              <div className="text-center">
                                <div className="text-[10px] text-textMuted uppercase tracking-wider">Calories</div>
                                <div className="text-sm font-bold text-textMain">
                                  {macros.portionCalories !== undefined ? macros.portionCalories : formatNumber(macros.calories)}
                                </div>
                                <div className="text-[9px] text-textMuted">kcal</div>
                              </div>
                              <div className="text-center">
                                <div className="text-[10px] text-textMuted uppercase tracking-wider">Protein</div>
                                <div className="text-sm font-bold text-textMain">
                                  {macros.portionProtein !== undefined ? macros.portionProtein : formatNumber(macros.protein)}
                                </div>
                                <div className="text-[9px] text-textMuted">g</div>
                              </div>
                              <div className="text-center">
                                <div className="text-[10px] text-textMuted uppercase tracking-wider">Carbs</div>
                                <div className="text-sm font-bold text-textMain">
                                  {macros.portionCarbs !== undefined ? macros.portionCarbs : formatNumber(macros.carbs)}
                                </div>
                                <div className="text-[9px] text-textMuted">g</div>
                              </div>
                              <div className="text-center">
                                <div className="text-[10px] text-textMuted uppercase tracking-wider">Fat</div>
                                <div className="text-sm font-bold text-textMain">
                                  {macros.portionFat !== undefined ? macros.portionFat : formatNumber(macros.fat)}
                                </div>
                                <div className="text-[9px] text-textMuted">g</div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-panelBorder bg-background p-4 text-center">
                      <RulerIcon className="mx-auto h-6 w-6 text-primary mb-2" />
                      <div className="text-xs font-medium text-textMuted mb-1">Estimated Volume</div>
                      <div className="text-lg font-bold text-textMain">{formatNumber(analysis.volume)} cm³</div>
                    </div>
                    <div className="rounded-xl border border-panelBorder bg-background p-4 text-center">
                      <ScaleIcon className="mx-auto h-6 w-6 text-primary mb-2" />
                      <div className="text-xs font-medium text-textMuted mb-1">Estimated Weight</div>
                      <div className="text-lg font-bold text-textMain">{formatNumber(analysis.weight)} g</div>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-panelBorder bg-panel p-6">
                  <h2 className="text-lg font-bold text-textMain mb-6">Quick Actions</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.title}
                          className="flex flex-col items-center justify-center p-4 rounded-xl border border-panelBorder bg-background hover:border-primary/50 transition-colors text-center"
                          type="button"
                          onClick={action.onClick}
                        >
                          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-panel border border-panelBorder mb-3 text-primary">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="text-sm font-bold text-textMain">{action.title}</div>
                          <div className="text-[10px] text-textMuted mt-1">{action.description}</div>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
                    type="button"
                    onClick={() => onNavigate("/")}
                  >
                    <PlusIcon className="h-4 w-4" /> New Analysis
                  </button>
                </section>
              </div>

              <div className="space-y-6">
                <section className="rounded-2xl border border-panelBorder bg-panel p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-900/30 text-primary">
                      <MacroChartIcon className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-bold text-textMain">Macronutrient Breakdown</h2>
                  </div>

                  <div className="h-64 mb-6 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          dataKey="value"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          stroke="none"
                          label={renderPieLabel}
                          labelLine={false}
                        >
                          {chartData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold text-textMain leading-none">{formatNumber(analysis.macros.calories)}</span>
                      <span className="text-xs text-textMuted mt-1">kcal</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { color: macroColors.protein, label: "Protein", value: `${formatNumber(analysis.macros.protein)}g` },
                      { color: macroColors.carbs, label: "Carbohydrates", value: `${formatNumber(analysis.macros.carbs)}g` },
                      { color: macroColors.fat, label: "Fat", value: `${formatNumber(analysis.macros.fat)}g` },
                      { color: macroColors.fiber, label: "Fiber", value: `${formatNumber(analysis.macros.fiber)}g` },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-background border border-panelBorder">
                        <div className="flex items-center gap-3">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm font-medium text-textMain">{item.label}</span>
                        </div>
                        <span className="text-sm font-bold text-textMain">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl border border-panelBorder bg-panel p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-900/30 text-primary">
                      <ShareIcon className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-bold text-textMain">Export &amp; Share</h2>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      { icon: FileIcon, label: "PDF" as ExportFormat },
                      { icon: TableIcon, label: "CSV" as ExportFormat },
                      { icon: CodeBracketsIcon, label: "JSON" as ExportFormat },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.label}
                          className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold transition-colors ${
                            selectedFormat === item.label
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-panelBorder bg-background text-textMuted hover:text-textMain"
                          }`}
                          type="button"
                          onClick={() => handleExport(item.label)}
                        >
                          <Icon className="h-4 w-4" /> {item.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition-colors"
                      type="button"
                      onClick={handleShare}
                    >
                      <ShareIcon className="h-4 w-4" /> Share Results
                    </button>
                    <button
                      className="flex items-center justify-center gap-2 rounded-xl bg-panel border border-panelBorder px-4 py-2.5 text-sm font-bold text-textMain hover:bg-panelBorder/50 transition-colors"
                      type="button"
                      onClick={handleCopy}
                    >
                      <CopyIcon className="h-4 w-4" /> Copy Data
                    </button>
                  </div>

                  <div className="rounded-xl border border-panelBorder bg-background p-3 flex gap-3">
                    <InfoIcon className="h-5 w-5 shrink-0 text-textMuted mt-0.5" />
                    <p className="text-xs text-textMuted leading-relaxed">
                      {statusMessage || "Exported data includes complete nutritional breakdown and detection results."}
                    </p>
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
