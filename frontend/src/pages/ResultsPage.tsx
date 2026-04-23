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

const renderPieLabel = ({
  cx,
  cy,
  innerRadius,
  outerRadius,
  midAngle,
  name,
}: {
  cx?: number;
  cy?: number;
  innerRadius?: number;
  outerRadius?: number;
  midAngle?: number;
  name?: string;
}) => {
  if (
    cx === undefined ||
    cy === undefined ||
    innerRadius === undefined ||
    outerRadius === undefined ||
    midAngle === undefined ||
    !name
  ) {
    return null;
  }

  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
  const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

  return (
    <text
      dominantBaseline="central"
      fill="#FFFFFF"
      fontSize="18"
      fontWeight="700"
      textAnchor="middle"
      x={x}
      y={y}
    >
      {name}
    </text>
  );
};

export const ResultsPage = ({ onBack, onNavigate }: ResultsPageProps) => {
  const analysis = useUploadStore((state) => state.analysis);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("JSON");
  const [statusMessage, setStatusMessage] = useState<string>("");

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
    if (!analysis) {
      return;
    }

    setSelectedFormat(format);

    if (format === "JSON") {
      downloadFile(
        `nutrivision-analysis-${analysis.id}.json`,
        JSON.stringify(analysis, null, 2),
        "application/json",
      );
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
          ${analysis.foods
            .map(
              (food) =>
                `<div class="row">${food.name} - ${(food.confidence * 100).toFixed(1)}%</div>`,
            )
            .join("")}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    setStatusMessage("PDF export opened in print dialog.");
  };

  const handleShare = async () => {
    if (!analysis) {
      return;
    }

    const shareText = `NutriVision analysis: ${analysis.macros.calories} kcal, ${analysis.macros.protein}g protein, ${analysis.macros.carbs}g carbs, ${analysis.macros.fat}g fat, ${analysis.macros.fiber}g fiber.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "NutriVision Analysis Results",
          text: shareText,
        });
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
    if (!analysis) {
      return;
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(analysis, null, 2));
      setStatusMessage("Analysis data copied to clipboard.");
    } catch {
      setStatusMessage("Copy failed. Please try again.");
    }
  };

  const quickActions: QuickAction[] = [
    {
      description: "Upload new food",
      icon: CameraIcon,
      title: truncateTitle("Analyze Another"),
      onClick: onBack,
    },
    {
      description: "View recommendations",
      icon: HeartIcon,
      title: truncateTitle("Health Insights"),
      onClick: () => onNavigate("/insights"),
    },
    {
      description: "Preferences",
      icon: UserIcon,
      title: truncateTitle("Update Profile"),
      onClick: () => onNavigate("/profile"),
    },
    {
      description: "With friends",
      icon: ShareIcon,
      title: truncateTitle("Share Results"),
      onClick: handleShare,
    },
  ];

  return (
    <main className="mx-auto max-w-[880px] overflow-hidden px-[48px] pb-[68px] pt-[52px]">
      <div className="flex items-center gap-[11px] text-[20px] font-[700] tracking-[-0.025em] text-[#99a8c2]">
        <HomeIcon className="h-[24px] w-[24px] text-[#a7b4cb]" />
        <button className="text-inherit" type="button" onClick={onBack}>
          Dashboard
        </button>
        <BreadcrumbChevronIcon className="h-[20px] w-[20px]" />
        <span className="text-[#ff7a12]">Analysis Results</span>
      </div>

      <h1 className="mt-[42px] text-[64px] font-[700] leading-[0.98] tracking-[-0.055em] text-[#f4f6fb]">
        Nutritional Analysis Results
      </h1>
      <p className="mt-[20px] max-w-[792px] text-[29px] font-[400] leading-[1.48] tracking-[-0.033em] text-[#97a6c1]">
        Comprehensive breakdown of your food&apos;s nutritional content and health insights
      </p>

      <div className="mt-[35px] flex gap-[16px]">
        <button
          className="flex h-[50px] min-w-[366px] items-center justify-center gap-[14px] rounded-[18px] bg-[#7d83eb] px-[22px] text-[25px] font-[700] tracking-[-0.03em] text-white"
          type="button"
          onClick={onBack}
        >
          <CameraIcon className="h-[28px] w-[28px]" />
          Analyze New Food
        </button>
        <button
          className="flex h-[50px] min-w-[290px] items-center justify-center gap-[14px] rounded-[18px] bg-[#7d83eb] px-[22px] text-[25px] font-[700] tracking-[-0.03em] text-white"
          type="button"
          onClick={() => onNavigate("/history")}
        >
          <HistoryIcon className="h-[28px] w-[28px]" />
          View History
        </button>
      </div>

      <div className="mt-[50px] flex gap-[15px]">
        <button className="flex h-[67px] min-w-[235px] items-center justify-center gap-[14px] rounded-[18px] bg-[#ff7a12] px-[24px] text-[25px] font-[500] tracking-[-0.03em] text-white" type="button">
          <OverviewIcon className="h-[32px] w-[32px]" />
          Overview
        </button>
        <button className="flex h-[67px] min-w-[343px] items-center justify-center gap-[14px] rounded-[18px] border border-[#5b576f] bg-[#1a202c] px-[24px] text-[25px] font-[500] tracking-[-0.03em] text-white" type="button">
          <ChartBarsIcon className="h-[32px] w-[32px]" />
          Detailed Nutrition
        </button>
        <button className="flex h-[67px] min-w-[290px] items-center justify-center gap-[14px] rounded-[18px] border border-[#5b576f] bg-[#1a202c] px-[24px] text-[25px] font-[500] tracking-[-0.03em] text-white" type="button" onClick={() => onNavigate("/insights")}>
          <HeartIcon className="h-[32px] w-[32px]" />
          Health Insights
        </button>
      </div>

      {!analysis ? (
        <section className="mt-[48px] rounded-[36px] border border-[#22314f] bg-[#1a202c] px-[48px] py-[44px]">
          <h2 className="text-[40px] font-[700] tracking-[-0.04em] text-[#f4f6fb]">No analysis data available</h2>
          <p className="mt-[18px] text-[24px] leading-[1.55] text-[#97a6c1]">
            Upload a food image first to view nutritional analysis results.
          </p>
          <button
            className="mt-[28px] flex h-[64px] items-center justify-center rounded-[24px] bg-[#ff7a12] px-[28px] text-[24px] font-[700] text-white"
            type="button"
            onClick={onBack}
          >
            Back to Dashboard
          </button>
        </section>
      ) : (
        <>
          <section className="mt-[48px] rounded-[36px] border border-[#22314f] bg-[#1a202c] px-[48px] pb-[50px] pt-[46px]">
            <div className="flex items-center gap-[18px] text-[#ff7a12]">
              <CameraIcon className="h-[39px] w-[39px]" />
              <h2 className="text-[37px] font-[700] tracking-[-0.04em] text-[#f4f6fb]">
                Food Detection Results
              </h2>
            </div>

            <img
              alt="Uploaded food"
              className="mt-[44px] h-[400px] w-full rounded-[34px] object-cover"
              src={analysis.imageUrl}
            />

            <h3 className="mt-[39px] text-center text-[28px] font-[600] tracking-[-0.03em] text-[#95a4bf]">
              Detected Food Items
            </h3>

            <div className="mt-[30px] space-y-[27px]">
              {analysis.foods.map((food) => (
                <div key={food.name} className="flex items-start justify-between gap-[20px]">
                  <div>
                    <div className="text-[34px] font-[700] leading-none tracking-[-0.03em] text-[#f4f6fb]">
                      {food.name}
                    </div>
                    <div className="mt-[14px] text-[22px] font-[600] leading-none tracking-[-0.03em] text-[#92a0ba]">
                      {foodCategories[food.name] ?? "Detected Item"}
                    </div>
                  </div>
                  <div className="pt-[8px] text-[31px] font-[700] leading-none tracking-[-0.03em] text-[#36d69b]">
                    {(food.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-[47px] grid grid-cols-2 gap-[32px]">
              <div className="rounded-[24px] border border-[#22314f] bg-[#0b1119] px-[22px] pb-[31px] pt-[28px] text-center">
                <RulerIcon className="mx-auto h-[32px] w-[32px] text-[#ff7a12]" />
                <div className="mt-[24px] text-[24px] font-[600] tracking-[-0.03em] text-[#95a4bf]">
                  Estimated Volume
                </div>
                <div className="mt-[14px] text-[33px] font-[700] tracking-[-0.04em] text-[#f4f6fb]">
                  {formatNumber(analysis.volume)} cm³
                </div>
              </div>
              <div className="rounded-[24px] border border-[#22314f] bg-[#0b1119] px-[22px] pb-[31px] pt-[28px] text-center">
                <ScaleIcon className="mx-auto h-[32px] w-[32px] text-[#ff7a12]" />
                <div className="mt-[24px] text-[24px] font-[600] tracking-[-0.03em] text-[#95a4bf]">
                  Estimated Weight
                </div>
                <div className="mt-[14px] text-[33px] font-[700] tracking-[-0.04em] text-[#f4f6fb]">
                  {formatNumber(analysis.weight)} g
                </div>
              </div>
            </div>
          </section>

          <section className="mt-[48px] rounded-[36px] border border-[#22314f] bg-[#1a202c] px-[48px] pb-[48px] pt-[46px]">
            <div className="flex items-center gap-[18px] text-[#ff7a12]">
              <MacroChartIcon className="h-[39px] w-[39px]" />
              <h2 className="text-[37px] font-[700] tracking-[-0.04em] text-[#f4f6fb]">
                Macronutrient Breakdown
              </h2>
            </div>

            <div className="mt-[34px] h-[392px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    dataKey="value"
                    innerRadius={84}
                    label={renderPieLabel}
                    labelLine={false}
                    outerRadius={146}
                    paddingAngle={1.6}
                    stroke="#1a202c"
                    strokeWidth={4}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-[2px] rounded-[30px] border border-[#22314f] bg-[#0b1119] px-[33px] py-[28px]">
              <div className="flex items-center justify-between gap-[20px]">
                <span className="text-[31px] font-[700] tracking-[-0.04em] text-[#f4f6fb]">
                  Total Calories
                </span>
                <span className="text-[31px] font-[700] tracking-[-0.04em] text-[#ff9a3d]">
                  {formatNumber(analysis.macros.calories)} kcal
                </span>
              </div>
            </div>

            <div className="mt-[44px] space-y-[41px]">
              {[
                { color: macroColors.protein, label: "Protein", value: `${formatNumber(analysis.macros.protein)}g` },
                { color: macroColors.carbs, label: "Carbohydrates", value: `${formatNumber(analysis.macros.carbs)}g` },
                { color: macroColors.fat, label: "Fat", value: `${formatNumber(analysis.macros.fat)}g` },
                { color: macroColors.fiber, label: "Fiber", value: `${formatNumber(analysis.macros.fiber)}g` },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-[20px]">
                  <div className="flex items-center gap-[18px]">
                    <span className="h-[17px] w-[17px] rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[31px] font-[500] leading-none tracking-[-0.03em] text-[#f4f6fb]">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-[31px] font-[600] leading-none tracking-[-0.03em] text-[#f4f6fb]">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-[49px] rounded-[36px] border border-[#22314f] bg-[#1a202c] px-[48px] pb-[44px] pt-[46px]">
            <div className="flex items-center gap-[18px] text-[#ff7a12]">
              <ShareIcon className="h-[39px] w-[39px]" />
              <h2 className="text-[37px] font-[700] tracking-[-0.04em] text-[#f4f6fb]">
                Export &amp; Share
              </h2>
            </div>

            <div className="mt-[42px] flex gap-[16px]">
              {[
                { icon: FileIcon, label: "PDF" as ExportFormat },
                { icon: TableIcon, label: "CSV" as ExportFormat },
                { icon: CodeBracketsIcon, label: "JSON" as ExportFormat },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    className={`flex h-[56px] min-w-[217px] items-center justify-center gap-[14px] rounded-[18px] border px-[24px] text-[25px] font-[700] tracking-[-0.03em] ${
                      selectedFormat === item.label
                        ? "border-[#7d83eb] bg-[#262b3d] text-[#f4f6fb]"
                        : "border-[#96909c] bg-[#1a202c] text-[#f4f6fb]"
                    }`}
                    type="button"
                    onClick={() => handleExport(item.label)}
                  >
                    <Icon className="h-[29px] w-[29px]" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-[34px] flex gap-[16px]">
              <button
                className="flex h-[68px] min-w-[335px] items-center justify-center gap-[16px] rounded-[22px] bg-[#ff7a12] px-[28px] text-[25px] font-[700] tracking-[-0.03em] text-white"
                type="button"
                onClick={handleShare}
              >
                <ShareIcon className="h-[28px] w-[28px]" />
                Share Results
              </button>
              <button
                className="flex h-[68px] min-w-[335px] items-center justify-center gap-[16px] rounded-[22px] bg-[#7d83eb] px-[28px] text-[25px] font-[700] tracking-[-0.03em] text-white"
                type="button"
                onClick={handleCopy}
              >
                <CopyIcon className="h-[28px] w-[28px]" />
                Copy Data
              </button>
            </div>

            <div className="mt-[33px] rounded-[28px] border border-[#22314f] bg-[#0b1119] px-[30px] py-[30px]">
              <div className="flex items-start gap-[18px]">
                <InfoIcon className="mt-[2px] h-[28px] w-[28px] shrink-0 text-[#93a1bb]" />
                <p className="text-[25px] leading-[1.55] tracking-[-0.03em] text-[#93a1bb]">
                  {statusMessage || "Exported data includes complete nutritional breakdown and detection results."}
                </p>
              </div>
            </div>
          </section>

          <section className="pt-[54px]">
            <h2 className="text-[34px] font-[700] tracking-[-0.04em] text-[#f4f6fb]">Quick Actions</h2>
            <div className="mt-[28px] grid grid-cols-2 gap-[18px]">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <button
                    key={action.title}
                    className="flex min-h-[154px] items-center gap-[30px] rounded-[28px] border border-[#22314f] bg-[#1a202c] px-[32px] py-[30px] text-left"
                    type="button"
                    onClick={action.onClick}
                  >
                    <div className="flex h-[81px] w-[81px] items-center justify-center rounded-[22px] bg-[#0b1119] text-[#ff7a12]">
                      <Icon className="h-[37px] w-[37px]" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[29px] font-[700] tracking-[-0.03em] text-[#f4f6fb]">
                        {action.title}
                      </div>
                      <div className="mt-[11px] truncate text-[23px] font-[600] tracking-[-0.03em] text-[#95a4bf]">
                        {action.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              className="ml-auto mt-[22px] flex h-[89px] min-w-[319px] items-center justify-center gap-[16px] rounded-[45px] bg-[#ff7a12] px-[34px] text-[25px] font-[500] tracking-[-0.03em] text-white"
              type="button"
              onClick={() => onNavigate("/")}
            >
              <PlusIcon className="h-[36px] w-[36px]" />
              New Analysis
            </button>
          </section>
        </>
      )}
    </main>
  );
};
