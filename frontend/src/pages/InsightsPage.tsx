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

const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const roundOne = (value: number) => Math.round(value * 10) / 10;

const formatPercent = (value: number) => `${Math.round(value)}%`;

const formatImprovement = (value: number) =>
  `${value > 0 ? "+" : ""}${Math.round(value)}%`;

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
  <section className="mt-[48px] rounded-[36px] border border-[#22314f] bg-[#1a202c] px-[40px] py-[44px]">
    <h2 className="text-[38px] font-[700] tracking-[-0.04em] text-[#f4f6fb]">
      Health Insights
    </h2>
    <p className="mt-[20px] text-[27px] leading-[1.45] tracking-[-0.03em] text-[#97a6c1]">
      Not enough data to generate insights.
    </p>
    <button
      className="mt-[28px] flex h-[88px] min-w-[318px] items-center justify-center gap-[16px] rounded-[44px] bg-[#ff9b44] px-[32px] text-[24px] font-[500] tracking-[-0.03em] text-white"
      type="button"
      onClick={() => onNavigate("/")}
    >
      <CameraIcon className="h-[34px] w-[34px]" />
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
        accent: "#FF9A3D",
        current: proteinGoal,
        icon: ProteinIcon,
        label: "Protein",
        suffix: "grams",
        target: 120,
      },
      {
        accent: "#FF9A3D",
        current: fiberGoal,
        icon: HistoryIcon,
        label: "Fiber",
        suffix: "grams",
        target: 25,
      },
      {
        accent: "#FF9A3D",
        current: waterGoal,
        icon: WaterIcon,
        label: "Water",
        suffix: "glasses",
        target: 8,
      },
      {
        accent: "#FF9A3D",
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
      { color: "#FF9A3D", label: "Protein", value: roundOne(proteinGoal) },
      { color: "#FF7A12", label: "Carbs", value: roundOne(latest.macros.carbs) },
      { color: "#39D29D", label: "Fat", value: roundOne(latest.macros.fat) },
      { color: "#AEBAD1", label: "Fiber", value: roundOne(fiberGoal) },
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
        accent: "#ff7d85",
        body:
          proteinGoal < 90
            ? "Your protein intake has been below target for recent entries."
            : "Protein intake is close to target but still has room to improve.",
        icon: WarningIcon,
        recommendation: "Recommended: Add protein-rich snacks between meals",
        timestamp: "2 hours ago",
        title: "Low Protein Intake",
      },
      {
        accent: "#ff9a3d",
        body:
          weekendAverage > weekdayAverage * 1.1
            ? "Your weekend calorie intake tends to be higher than weekdays."
            : "Your calorie intake is trending upward later in the week.",
        icon: TrendUpIcon,
        recommendation: "Recommended: Plan balanced weekend meals in advance",
        timestamp: "1 day ago",
        title: "Calorie Trend Analysis",
      },
      {
        accent: "#36d69b",
        body:
          fiberGoalDays >= 5
            ? "Congratulations! You've met your fiber goal for 5 days this week."
            : "Fiber intake is improving across the week.",
        icon: CheckCircleIcon,
        recommendation:
          fiberGoalDays >= 5
            ? "Keep up the great work!"
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
    <main className="mx-auto max-w-[880px] overflow-hidden px-[40px] pb-[72px] pt-[42px]">
      <div className="flex items-center gap-[10px] text-[20px] font-[700] tracking-[-0.025em] text-[#99a8c2]">
        <HomeIcon className="h-[24px] w-[24px] text-[#a7b4cb]" />
        <button className="text-inherit" type="button" onClick={() => onNavigate("/")}>
          Dashboard
        </button>
        <BreadcrumbChevronIcon className="h-[20px] w-[20px]" />
        <span className="text-[#99a8c2]">Health Insights</span>
      </div>

      <div className="mt-[29px] flex items-start gap-[29px]">
        <InsightsSparkIcon className="mt-[14px] h-[55px] w-[55px] text-[#ff9b44]" />
        <div className="min-w-0">
          <h1 className="text-[67px] font-[700] leading-[0.98] tracking-[-0.055em] text-[#f4f6fb]">
            Health Insights
          </h1>
          <p className="mt-[10px] truncate text-[30px] font-[400] leading-[1.3] tracking-[-0.03em] text-[#97a6c1]">
            Personalized recommendations based on your nutritional data
          </p>
        </div>
      </div>

      {errorMessage ? (
        <section className="mt-[48px] rounded-[36px] border border-[#5b2430] bg-[#311821] px-[40px] py-[30px] text-[24px] font-[600] leading-[1.45] text-[#ffb4c2]">
          {errorMessage}
        </section>
      ) : null}

      {!errorMessage && !isFetching && !insights ? (
        <EmptyInsightsState onNavigate={onNavigate} />
      ) : null}

      {!errorMessage && insights ? (
        <>
          <section className="mt-[54px] rounded-[36px] border border-[#22314f] bg-[#1a202c] px-[48px] py-[46px]">
            <div className="grid grid-cols-[190px_1fr] items-center gap-[36px]">
              <div>
                <div className="text-[31px] font-[500] tracking-[-0.03em] text-[#97a6c1]">
                  Health Score
                </div>
                <div className="mt-[18px] flex items-end gap-[12px]">
                  <span className="text-[74px] font-[700] leading-none tracking-[-0.06em] text-[#ff9a3d]">
                    {insights.currentScore}
                  </span>
                  <span className="pb-[12px] text-[24px] font-[700] tracking-[-0.03em] text-[#39d29d]">
                    ↗ {formatImprovement(insights.improvement)}
                  </span>
                </div>
              </div>
              <p className="text-[29px] leading-[1.42] tracking-[-0.03em] text-[#97a6c1]">
                Your overall health score has improved by {Math.max(insights.improvement, 0)}% this week based on nutritional intake and dietary consistency.
              </p>
            </div>
          </section>

          <section className="mt-[48px] rounded-[36px] border border-[#22314f] bg-[#1a202c] px-[48px] pb-[42px] pt-[44px]">
            <div className="flex items-center justify-between">
              <h2 className="text-[38px] font-[700] tracking-[-0.04em] text-[#f4f6fb]">
                Daily Goals
              </h2>
              <TargetIcon className="h-[39px] w-[39px] text-[#a8b4cb]" />
            </div>

            <div className="mt-[38px] space-y-[34px]">
              {insights.goals.map((goal) => {
                const percent = clamp((goal.current / goal.target) * 100, 0, 100);
                const Icon = goal.icon;

                return (
                  <div key={goal.label}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-[14px]">
                        <Icon className="h-[28px] w-[28px] text-[#a8b4cb]" />
                        <span className="text-[28px] font-[700] tracking-[-0.03em] text-[#f4f6fb]">
                          {goal.label}
                        </span>
                      </div>
                      <div className="text-[28px] font-[700] tracking-[-0.03em]">
                        <span className="text-[#ff9a3d]">{goal.current}</span>
                        <span className="text-[#a8b4cb]"> / {goal.target}</span>
                      </div>
                    </div>
                    <div className="mt-[16px] h-[13px] w-full bg-[#25324b]">
                      <div className="h-full bg-[#ff9a3d]" style={{ width: `${percent}%` }} />
                    </div>
                    <div className="mt-[12px] flex items-center justify-between">
                      <span className="text-[22px] font-[600] tracking-[-0.03em] text-[#97a6c1]">
                        {goal.suffix}
                      </span>
                      <span className="text-[22px] font-[700] tracking-[-0.03em] text-[#a8b4cb]">
                        {formatPercent(percent)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-[50px] rounded-[36px] border border-[#22314f] bg-[#1a202c] px-[48px] pb-[52px] pt-[46px]">
            <div className="flex items-center justify-between">
              <h2 className="text-[36px] font-[700] tracking-[-0.04em] text-[#f4f6fb]">
                Weekly Calorie Trends
              </h2>
              <TrendUpIcon className="h-[37px] w-[37px] text-[#ff9a3d]" />
            </div>
            <div className="mt-[26px] h-[376px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={insights.calorieTrend} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="caloriesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3c322d" stopOpacity={0.94} />
                      <stop offset="100%" stopColor="#3c322d" stopOpacity={0.94} />
                    </linearGradient>
                  </defs>
                  <XAxis axisLine={false} dataKey="day" tick={{ fill: "#99a8c2", fontSize: 18 }} tickLine={false} />
                  <Tooltip content={() => null} />
                  <Area dataKey="value" fill="url(#caloriesFill)" stroke="#ff9a3d" strokeWidth={4} type="monotone" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="mt-[38px] rounded-[36px] border border-[#22314f] bg-[#1a202c] px-[48px] pb-[52px] pt-[46px]">
            <div className="flex items-center justify-between">
              <h2 className="text-[36px] font-[700] tracking-[-0.04em] text-[#f4f6fb]">
                Weekly Protein Intake
              </h2>
              <StatsIcon className="h-[37px] w-[37px] text-[#39d29d]" />
            </div>
            <div className="mt-[26px] h-[376px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={insights.proteinTrend} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="proteinFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1b3839" stopOpacity={0.96} />
                      <stop offset="100%" stopColor="#1b3839" stopOpacity={0.96} />
                    </linearGradient>
                  </defs>
                  <XAxis axisLine={false} dataKey="day" tick={{ fill: "#99a8c2", fontSize: 18 }} tickLine={false} />
                  <Tooltip content={() => null} />
                  <Area dataKey="value" fill="url(#proteinFill)" stroke="#39d29d" strokeWidth={4} type="monotone" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="mt-[38px] rounded-[36px] border border-[#22314f] bg-[#1a202c] px-[48px] pb-[46px] pt-[46px]">
            <div className="flex items-center justify-between">
              <h2 className="text-[36px] font-[700] tracking-[-0.04em] text-[#f4f6fb]">
                Daily Macro Balance
              </h2>
              <MacroChartIcon className="h-[40px] w-[40px] text-[#a8b4cb]" />
            </div>

            <div className="mt-[22px] grid grid-cols-[1fr_220px] items-center gap-[20px]">
              <div className="h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={insights.macroBalance}
                      cx="48%"
                      cy="48%"
                      dataKey="value"
                      innerRadius={85}
                      outerRadius={168}
                      stroke="#1a202c"
                      strokeWidth={4}
                      labelLine={false}
                      label={({ name, x, y }) =>
                        x !== undefined && y !== undefined ? (
                          <text x={x} y={y} fill="#ffffff" fontSize="18" fontWeight="700" textAnchor="middle">
                            {name}
                          </text>
                        ) : null
                      }
                    >
                      {insights.macroBalance.map((item) => (
                        <Cell key={item.label} fill={item.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-[22px]">
                {insights.macroBalance.slice(0, 3).map((item) => (
                  <div key={item.label} className="flex items-center gap-[12px]">
                    <span className="h-[18px] w-[18px] rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[26px] font-[700] tracking-[-0.03em] text-[#f4f6fb]">
                      {item.label}: {item.value}g
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-[14px] border-t border-[#263551] pt-[36px]">
              <div className="flex items-center justify-between">
                <span className="text-[34px] font-[700] tracking-[-0.04em] text-[#97a6c1]">
                  Total Daily Intake
                </span>
                <span className="text-[34px] font-[700] tracking-[-0.04em] text-[#f4f6fb]">
                  {insights.totalDailyIntake}g
                </span>
              </div>
            </div>
          </section>

          <section className="pt-[46px]">
            <div className="flex items-center justify-between">
              <h2 className="text-[40px] font-[700] tracking-[-0.04em] text-[#f4f6fb]">
                Health Alerts
              </h2>
              <div className="rounded-[18px] border border-[#5b4b55] bg-[#33242a] px-[30px] py-[16px] text-[25px] font-[500] tracking-[-0.03em] text-[#ff7d85]">
                {insights.alerts.length} active
              </div>
            </div>

            <div className="mt-[30px] space-y-[36px]">
              {insights.alerts.map((alert) => {
                const Icon = alert.icon;

                return (
                  <div
                    key={alert.title}
                    className="rounded-[30px] border border-[#22314f] bg-transparent px-[36px] pb-[30px] pt-[32px]"
                  >
                    <div className="flex items-start justify-between gap-[16px]">
                      <div className="flex items-start gap-[18px]">
                        <Icon className="mt-[4px] h-[34px] w-[34px]" style={{ color: alert.accent }} />
                        <div>
                          <div className="text-[31px] font-[700] tracking-[-0.03em] text-[#f4f6fb]">
                            {alert.title}
                          </div>
                          <p className="mt-[18px] max-w-[620px] text-[28px] leading-[1.46] tracking-[-0.03em] text-[#97a6c1]">
                            {alert.body}
                          </p>
                          <p className="mt-[10px] max-w-[620px] text-[24px] leading-[1.35] tracking-[-0.03em]" style={{ color: alert.accent }}>
                            {alert.recommendation}
                          </p>
                          <div className="mt-[18px] flex items-center gap-[10px] text-[22px] font-[600] tracking-[-0.03em] text-[#54627d]">
                            <HistoryIcon className="h-[22px] w-[22px]" />
                            {alert.timestamp}
                          </div>
                        </div>
                      </div>
                      <CloseIcon className="h-[30px] w-[30px] text-[#52617b]" />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="flex justify-end pt-[66px]">
            <button
              className="flex h-[96px] min-w-[319px] items-center justify-center gap-[18px] rounded-[48px] bg-[#ff9b44] px-[34px] text-[24px] font-[500] tracking-[-0.03em] text-white"
              type="button"
              onClick={() => onNavigate("/")}
            >
              <CameraIcon className="h-[36px] w-[36px]" />
              Analyze Food
            </button>
          </div>
        </>
      ) : null}
    </main>
  );
};
