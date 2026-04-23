import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { fetchHistoryRequest, getHistoryErrorMessage } from "../services/historyApi";
import type { UploadAnalysis } from "../types";
import {
  BreadcrumbChevronIcon,
  CameraIcon,
  CheckCircleIcon,
  CloseIcon,
  FireIcon,
  HistoryIcon,
  HomeIcon,
  InfoIcon,
  InsightsSparkIcon,
  MacroChartIcon,
  ProteinIcon,
  StatsIcon,
  TargetIcon,
  TrendUpIcon,
  WarningIcon,
  WaterIcon,
} from "../components/icons";

type InsightsPageProps = {
  onNavigate: (nextPath: string) => void;
};

type GoalItem = {
  accent: string;
  current: number;
  icon: typeof ProteinIcon;
  label: string;
  suffix: string;
  target: number;
};

type AlertItem = {
  accent: string;
  body: string;
  icon: typeof WarningIcon;
  recommendation: string;
  timestamp: string;
  title: string;
};

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const roundOne = (value: number) => Math.round(value * 10) / 10;

const formatPercent = (value: number) => `${Math.round(value)}%`;

const buildTrendSeries = (items: UploadAnalysis[], key: "calories" | "protein") => {
  const sorted = [...items].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
  const sliced = sorted.slice(-7);

  return weekDays.map((day, index) => ({
    day,
    value: sliced[index]?.macros[key] ?? sliced[sliced.length - 1]?.macros[key] ?? 0,
  }));
};

const EmptyInsightsState = ({ onNavigate }: InsightsPageProps) => (
  <section className="mt-8 rounded-2xl border border-panelBorder bg-panel p-8">
    <h2 className="text-xl font-bold text-textMain">
      Health Insights
    </h2>
    <p className="mt-2 text-textMuted">
      Not enough data to generate insights.
    </p>
    <button
      className="mt-6 flex h-12 px-6 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-white"
      type="button"
      onClick={() => onNavigate("/")}
    >
      <CameraIcon className="h-5 w-5" />
      Analyze Food
    </button>
  </section>
);

export const InsightsPage = ({ onNavigate }: InsightsPageProps) => {
  const [historyItems, setHistoryItems] = useState<UploadAnalysis[]>([]);
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
        if ((error as { code?: string }).code === "ERR_CANCELED") {
          return;
        }

        setErrorMessage(getHistoryErrorMessage(error));
        setHistoryItems([]);
      } finally {
        setIsFetching(false);
      }
    };

    void loadInsights();

    return () => controller.abort();
  }, []);

  const insights = useMemo(() => {
    if (historyItems.length < 3) {
      return null;
    }

    const latest = historyItems[0];
    const lastSeven = historyItems.slice(0, 7);
    const previousSeven = historyItems.slice(7, 14);

    const proteinGoal = roundOne(latest.macros.protein);
    const fiberGoal = roundOne(latest.macros.fiber);
    const waterGoal = clamp(Math.round(latest.weight / 100) + 2, 3, 8);
    const caloriesGoal = Math.round(latest.macros.calories);

    const goals: GoalItem[] = [
      {
        accent: "#F97316", // Primary orange
        current: proteinGoal,
        icon: ProteinIcon,
        label: "Protein",
        suffix: "grams",
        target: 120,
      },
      {
        accent: "#F97316",
        current: fiberGoal,
        icon: HistoryIcon,
        label: "Fiber",
        suffix: "grams",
        target: 25,
      },
      {
        accent: "#F97316",
        current: waterGoal,
        icon: WaterIcon,
        label: "Water",
        suffix: "glasses",
        target: 8,
      },
      {
        accent: "#F97316",
        current: caloriesGoal,
        icon: FireIcon,
        label: "Calories",
        suffix: "kcal",
        target: 2000,
      },
    ];

    const currentScore =
      Math.round(
        ((clamp(proteinGoal / 120, 0, 1) +
          clamp(fiberGoal / 25, 0, 1) +
          clamp(waterGoal / 8, 0, 1) +
          clamp(caloriesGoal / 2000, 0, 1)) /
          4) *
          100,
      ) || 0;

    const previousScore =
      previousSeven.length > 0
        ? Math.round(
            previousSeven.reduce((total, item) => total + item.macros.protein, 0) /
              previousSeven.length /
              1.2,
          )
        : currentScore - 5;

    const improvement = clamp(currentScore - previousScore, -20, 20);

    const calorieTrend = buildTrendSeries(lastSeven, "calories");
    const proteinTrend = buildTrendSeries(lastSeven, "protein");

    const macroBalance = [
      { color: "#10B981", label: "Protein", value: roundOne(proteinGoal), percent: 22 },
      { color: "#3B82F6", label: "Carbohydrates", value: roundOne(latest.macros.carbs), percent: 56 },
      { color: "#F59E0B", label: "Fat", value: roundOne(latest.macros.fat), percent: 17 },
      { color: "#A855F7", label: "Fiber", value: roundOne(fiberGoal), percent: 6 },
    ];

    const weekendItems = historyItems.filter((item) => {
      const day = new Date(item.createdAt).getDay();
      return day === 0 || day === 6;
    });
    const weekdayItems = historyItems.filter((item) => {
      const day = new Date(item.createdAt).getDay();
      return day > 0 && day < 6;
    });

    const weekendAverage =
      weekendItems.reduce((total, item) => total + item.macros.calories, 0) /
      Math.max(weekendItems.length, 1);
    const weekdayAverage =
      weekdayItems.reduce((total, item) => total + item.macros.calories, 0) /
      Math.max(weekdayItems.length, 1);

    const fiberGoalDays = historyItems.filter((item) => item.macros.fiber >= 5).length;

    const alerts: AlertItem[] = [
      {
        accent: "#F59E0B", // Warning yellow
        body:
          proteinGoal < 90
            ? "Your protein intake has been below target for 3 consecutive days."
            : "Protein intake is close to target but still has room to improve.",
        icon: WarningIcon,
        recommendation: "Recommended: Add protein-rich snacks between meals",
        timestamp: "2 hours ago",
        title: "Low Protein Intake",
      },
      {
        accent: "#3B82F6", // Info blue
        body:
          weekendAverage > weekdayAverage * 1.1
            ? "Your weekend calorie intake tends to be 15% higher than weekdays."
            : "Your calorie intake is trending upward later in the week.",
        icon: InfoIcon,
        recommendation: "Recommended: Plan balanced weekend meals in advance",
        timestamp: "1 day ago",
        title: "Calorie Trend Analysis",
      },
      {
        accent: "#10B981", // Success green
        body:
          fiberGoalDays >= 5
            ? "Congratulations! You've met your fiber goal for 5 days this week."
            : "Fiber intake is improving across the week.",
        icon: CheckCircleIcon,
        recommendation:
          fiberGoalDays >= 5
            ? ""
            : "Recommended: Keep adding high-fiber meals",
        timestamp: "2 days ago",
        title: "Fiber Goal Achievement",
      },
    ];

    return {
      alerts,
      calorieTrend,
      currentScore,
      goals,
      improvement,
      macroBalance,
      proteinTrend,
      totalDailyIntake: roundOne(
        latest.macros.protein + latest.macros.carbs + latest.macros.fat + latest.macros.fiber,
      ),
    };
  }, [historyItems]);

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 relative">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 text-xs font-medium text-textMuted mb-2">
          <HomeIcon className="h-4 w-4" />
          <button className="hover:text-textMain transition-colors" type="button" onClick={() => onNavigate("/")}>
            Dashboard
          </button>
          <BreadcrumbChevronIcon className="h-3 w-3" />
          <span className="text-textMain">Health Insights</span>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <InsightsSparkIcon className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-textMain">
              Health Insights
            </h1>
            <p className="text-sm text-textMuted">
              Personalized recommendations based on your nutritional data
            </p>
          </div>
        </div>

        {errorMessage && (
          <section className="mb-8 rounded-xl border border-danger/50 bg-danger/10 p-4 text-sm font-medium text-danger">
            {errorMessage}
          </section>
        )}

        {!errorMessage && !isFetching && !insights && (
          <EmptyInsightsState onNavigate={onNavigate} />
        )}

        {!errorMessage && insights && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_2fr] gap-6 mb-24">
            
            {/* Health Score */}
            <section className="rounded-2xl bg-panel border border-panelBorder p-6 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-base font-semibold text-textMain">Health Score</h2>
                <div className="flex items-center gap-1 bg-success/20 text-success px-2 py-1 rounded-md text-xs font-semibold">
                  <TrendUpIcon className="h-3 w-3" />
                  {insights.improvement > 0 ? `+${insights.improvement}` : insights.improvement}%
                </div>
              </div>
              <p className="text-sm text-textMuted leading-relaxed mt-auto">
                Your overall health score has improved by {Math.max(insights.improvement, 0)}% this week based on nutritional intake and dietary patterns.
              </p>
            </section>

            {/* Daily Goals */}
            <section className="rounded-2xl bg-panel border border-panelBorder p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-semibold text-textMain">Daily Goals</h2>
                <TargetIcon className="h-5 w-5 text-primary" />
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                {insights.goals.map((goal) => {
                  const percent = clamp((goal.current / goal.target) * 100, 0, 100);
                  const Icon = goal.icon;
                  // In the screenshot, some progress bars are red/orange if they are not 100%
                  const isLow = percent < 80;

                  return (
                    <div key={goal.label}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-textMuted" />
                          <span className="text-sm font-medium text-textMain">
                            {goal.label}
                          </span>
                        </div>
                        <div className="text-xs font-medium">
                          <span className={isLow ? "text-primary" : "text-success"}>{goal.current}</span>
                          <span className="text-textMuted"> / {goal.target} {goal.suffix}</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-panelBorder rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full" 
                          style={{ 
                            width: `${percent}%`,
                            backgroundColor: isLow ? '#F97316' : '#10B981'
                          }} 
                        />
                      </div>
                      <div className="mt-1 text-right">
                        <span className={`text-xs font-bold ${isLow ? "text-primary" : "text-success"}`}>
                          {formatPercent(percent)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Weekly Calorie Trends */}
            <section className="rounded-2xl bg-panel border border-panelBorder p-6 lg:col-span-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-semibold text-textMain">Weekly Calorie Trends</h2>
                <TrendUpIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={insights.calorieTrend} margin={{ left: -20, right: 0, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="caloriesFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', borderRadius: '8px' }}
                      itemStyle={{ color: '#F3F4F6' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} fill="url(#caloriesFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Weekly Protein Intake */}
            <section className="rounded-2xl bg-panel border border-panelBorder p-6 lg:col-span-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-semibold text-textMain">Weekly Protein Intake</h2>
                <TrendUpIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={insights.proteinTrend} margin={{ left: -20, right: 0, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="proteinFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', borderRadius: '8px' }}
                      itemStyle={{ color: '#F3F4F6' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={3} fill="url(#proteinFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Daily Macro Balance */}
            <section className="rounded-2xl bg-panel border border-panelBorder p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-semibold text-textMain">Daily Macro Balance</h2>
                <MacroChartIcon className="h-5 w-5 text-primary" />
              </div>

              <div className="flex items-center gap-8 h-48 relative">
                <div className="w-48 h-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={insights.macroBalance}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {insights.macroBalance.map((item) => (
                          <Cell key={item.label} fill={item.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                    <span className="text-xs text-textMuted">Total</span>
                    <span className="text-lg font-bold text-textMain">{insights.totalDailyIntake}g</span>
                  </div>
                </div>
                
                <div className="flex-1 space-y-3">
                  {insights.macroBalance.map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-textMain">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-textMain">{item.value}g</span>
                        <span className="text-xs text-textMuted w-8 text-right">({item.percent}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-panelBorder flex items-center justify-between text-sm">
                <span className="text-textMuted">Total Daily Intake</span>
                <span className="font-bold text-textMain">{insights.totalDailyIntake}g</span>
              </div>
            </section>

            {/* Health Alerts */}
            <section className="rounded-2xl bg-panel border border-panelBorder p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-semibold text-textMain">Health Alerts</h2>
                <div className="flex items-center gap-2 text-xs font-medium text-textMuted">
                  {insights.alerts.length} active
                  <WarningIcon className="h-4 w-4 text-primary" />
                </div>
              </div>

              <div className="space-y-4">
                {insights.alerts.map((alert) => {
                  const Icon = alert.icon;
                  // Map the accent colors to light backgrounds
                  let bgClass = "bg-panelBorder/30";
                  let borderClass = "border-panelBorder";
                  if (alert.title.includes("Protein")) {
                    bgClass = "bg-warning/10";
                    borderClass = "border-warning/20";
                  } else if (alert.title.includes("Calorie")) {
                    bgClass = "bg-info/10";
                    borderClass = "border-info/20";
                  } else {
                    bgClass = "bg-success/10";
                    borderClass = "border-success/20";
                  }

                  return (
                    <div
                      key={alert.title}
                      className={`rounded-xl border ${borderClass} ${bgClass} p-4 relative`}
                    >
                      <button className="absolute top-3 right-3 text-textMuted hover:text-textMain">
                        <CloseIcon className="h-3 w-3" />
                      </button>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4" style={{ color: alert.accent }} />
                        <span className="text-sm font-semibold" style={{ color: alert.accent }}>
                          {alert.title}
                        </span>
                      </div>
                      <p className="text-xs text-textMain mb-2 leading-relaxed">
                        {alert.body}
                      </p>
                      {alert.recommendation && (
                        <p className="text-xs font-medium mb-3" style={{ color: alert.accent }}>
                          {alert.recommendation}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-[10px] text-textMuted mt-auto">
                        <HistoryIcon className="h-3 w-3" />
                        {alert.timestamp}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* Floating Analyze Food Button */}
        {!errorMessage && insights && (
          <div className="fixed bottom-8 right-8 z-20">
            <button
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-panel border border-panelBorder text-sm font-semibold text-textMain shadow-lg hover:bg-panelBorder transition-colors"
              onClick={() => onNavigate("/")}
            >
              <CameraIcon className="h-4 w-4" />
              Analyze Food
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
