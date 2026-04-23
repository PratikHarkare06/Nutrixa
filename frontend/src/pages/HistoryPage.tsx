import { useEffect, useMemo, useState } from "react";
import { fetchHistoryRequest, getHistoryErrorMessage } from "../services/historyApi";
import { useUploadStore } from "../store/uploadStore";
import type { HistoryPagination, UploadAnalysis } from "../types";
import {
  BoltIcon,
  BreadcrumbChevronIcon,
  CalendarIcon,
  CameraIcon,
  ChevronDownIcon,
  EyeIcon,
  FireIcon,
  ForkKnifeIcon,
  HistoryIcon,
  HomeIcon,
  RotateCwIcon,
  SearchIcon,
  SlidersIcon,
  SquareIcon,
  StatsIcon,
  TargetIcon,
  TrashIcon,
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

const formatCalories = (value: number) => `${Math.round(value)} cal`;
const formatMacro = (value: number) => `${Number.isInteger(value) ? value : value.toFixed(1)}g`;
const formatCompactNumber = (value: number) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return `${value}`;
};

const formatHistoryDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));

const HistoryMetricCard = ({
  icon: Icon,
  title,
  value,
}: {
  icon: typeof StatsIcon;
  title: string;
  value: string;
}) => (
  <div className="rounded-2xl border border-panelBorder bg-panel p-6 flex items-center gap-4">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-900/30 text-primary">
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <div className="text-2xl font-bold tracking-tight text-textMain">
        {value}
      </div>
      <div className="text-sm font-medium text-textMuted mt-0.5">
        {title}
      </div>
    </div>
  </div>
);

export const HistoryPage = ({ onNavigate }: HistoryPageProps) => {
  const setAnalysis = useUploadStore((state) => state.setAnalysis);
  const [historyItems, setHistoryItems] = useState<UploadAnalysis[]>([]);
  const [pagination, setPagination] = useState<HistoryPagination>({
    limit: 5,
    page: 1,
    total: 0,
  });
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<SortValue>("desc");
  const [isFetching, setIsFetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
        if ((error as { code?: string }).code === "ERR_CANCELED") {
          return;
        }

        setErrorMessage(getHistoryErrorMessage(error));
        if (pagination.page === 1) {
          setHistoryItems([]);
        }
      } finally {
        setIsFetching(false);
      }
    };

    void loadHistory();

    return () => controller.abort();
  }, [pagination.page, pagination.limit, searchTerm, sort]);

  const primaryCards = useMemo(() => {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const weeklyCount = historyItems.filter(
      (item) => now - new Date(item.createdAt).getTime() <= sevenDays,
    ).length;
    const averageCalories =
      historyItems.length > 0
        ? Math.round(
            historyItems.reduce((total, item) => total + item.macros.calories, 0) /
              historyItems.length,
          )
        : 0;
    const identified = historyItems.reduce((total, item) => total + item.foods.length, 0);

    return [
      { icon: StatsIcon, title: "Total Items", value: `${pagination.total}` },
      { icon: CalendarIcon, title: "This Week", value: `${weeklyCount}` },
      { icon: BoltIcon, title: "Avg Calories", value: formatCompactNumber(averageCalories) },
      { icon: ForkKnifeIcon, title: "Ingredients", value: `${identified}` },
    ] as const;
  }, [historyItems, pagination.total]);

  const hasMore = historyItems.length < pagination.total;

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-5xl mx-auto pb-24">
          
          <div className="flex items-center gap-2 text-xs font-medium text-textMuted mb-2">
            <HomeIcon className="h-4 w-4" />
            <button className="hover:text-textMain transition-colors" type="button" onClick={() => onNavigate("/")}>
              Dashboard
            </button>
            <BreadcrumbChevronIcon className="h-3 w-3" />
            <span className="text-textMain">History</span>
          </div>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-textMain">Detection History</h1>
              <p className="mt-1 text-sm text-textMuted">Review your analyzed food items</p>
            </div>
            <button
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
              type="button"
              onClick={() => onNavigate("/")}
            >
              <CameraIcon className="h-4 w-4" />
              Upload Food
            </button>
          </div>

          <section className="grid grid-cols-4 gap-4 mb-8">
            {primaryCards.map((card) => (
              <HistoryMetricCard
                key={card.title}
                icon={card.icon}
                title={card.title}
                value={card.value}
              />
            ))}
          </section>

          <section className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="flex-1 w-full relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-textMuted" />
              <input
                className="w-full rounded-lg border border-panelBorder bg-panel py-2.5 pl-10 pr-4 text-sm text-textMain placeholder-textMuted focus:border-primary focus:outline-none"
                placeholder="Search history..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative">
                <select
                  className="appearance-none rounded-lg border border-panelBorder bg-panel px-4 py-2.5 pr-10 text-sm font-medium text-textMain focus:border-primary focus:outline-none"
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value as SortValue);
                    setPagination((current) => ({ ...current, page: 1 }));
                  }}
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-textMuted" />
              </div>
              <button
                className="flex items-center justify-center rounded-lg border border-panelBorder bg-panel p-2.5 text-textMuted hover:text-textMain transition-colors"
                type="button"
              >
                <SlidersIcon className="h-5 w-5" />
              </button>
            </div>
          </section>

          {errorMessage ? (
            <section className="mt-8 rounded-lg border border-danger/50 bg-danger/10 px-6 py-4 text-sm font-medium text-danger">
              {errorMessage}
            </section>
          ) : null}

          {!errorMessage && !isFetching && historyItems.length === 0 ? (
            <section className="mt-8 rounded-2xl border border-dashed border-panelBorder bg-panel/30 px-6 py-12 text-center text-sm font-medium text-textMuted flex flex-col items-center">
              <HistoryIcon className="h-8 w-8 mb-4 opacity-50" />
              No history available yet
            </section>
          ) : null}

          <section className="space-y-4">
            {historyItems.map((item) => {
              const primaryFood = item.foods[0];
              const confidence = primaryFood ? Math.round(primaryFood.confidence * 100) : 0;
              const category = primaryFood ? foodCategories[primaryFood.name] ?? "Detected Item" : "Detected Item";

              return (
                <button
                  key={item.id}
                  className="w-full group rounded-2xl border border-panelBorder bg-panel p-5 text-left hover:border-primary/50 transition-colors"
                  type="button"
                  onClick={() => {
                    setAnalysis(item);
                    onNavigate("/results");
                  }}
                >
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-panelBorder/50">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-xs font-semibold text-textMuted">
                        {formatHistoryDate(item.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-textMuted opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="hover:text-primary transition-colors">
                        <RotateCwIcon className="h-4 w-4" />
                      </div>
                      <div className="hover:text-danger transition-colors">
                        <TrashIcon className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <img
                      alt={primaryFood?.name || "History food"}
                      className="h-28 w-28 rounded-xl object-cover"
                      src={item.imageUrl}
                    />
                    <div className="flex-1 pt-1">
                      <div className="flex justify-between items-start mb-1">
                        <div className="text-lg font-bold text-textMain">
                          {primaryFood?.name || "Unknown Item"}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-success bg-success/10 px-2.5 py-1 rounded-full">
                          <TargetIcon className="h-3.5 w-3.5" />
                          {confidence}% match
                        </div>
                      </div>
                      <div className="text-sm font-medium text-textMuted mb-4">
                        {category} • {Math.round(item.weight)}g
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs font-medium text-textMuted mb-1 flex items-center gap-1">
                            <FireIcon className="h-3 w-3 text-orange-500" /> Calories
                          </div>
                          <div className="text-base font-bold text-textMain">
                            {formatCalories(item.macros.calories)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-textMuted mb-1">Protein</div>
                          <div className="text-base font-bold text-purple-400">
                            {formatMacro(item.macros.protein)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-textMuted mb-1">Carbs</div>
                          <div className="text-base font-bold text-emerald-400">
                            {formatMacro(item.macros.carbs)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-textMuted mb-1">Fat</div>
                          <div className="text-base font-bold text-orange-400">
                            {formatMacro(item.macros.fat)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </section>

          {hasMore ? (
            <button
              className="mt-8 flex w-full items-center justify-center rounded-xl border border-panelBorder bg-panel py-3 text-sm font-medium text-textMain hover:bg-panelBorder/50 transition-colors"
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
          ) : null}
        </div>
      </div>
    </div>
  );
};
