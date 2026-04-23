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
  <div className="rounded-[31px] border border-[#22314f] bg-[#1a202c] px-[32px] py-[36px]">
    <div className="flex items-center gap-[31px]">
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-[#342920] text-[#ff7a12]">
        <Icon className="h-[34px] w-[34px]" />
      </div>
      <div>
        <div className="text-[42px] font-[700] leading-none tracking-[-0.04em] text-[#f4f6fb]">
          {value}
        </div>
        <div className="mt-[14px] text-[26px] font-[600] leading-none tracking-[-0.03em] text-[#97a6c1]">
          {title}
        </div>
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
      { icon: StatsIcon, title: "Total", value: `${pagination.total}` },
      { icon: CalendarIcon, title: "Weekly", value: `${weeklyCount}` },
      { icon: BoltIcon, title: "Avg Cal", value: formatCompactNumber(averageCalories) },
      { icon: ForkKnifeIcon, title: "Identified", value: `${identified}` },
    ] as const;
  }, [historyItems, pagination.total]);

  const hasMore = historyItems.length < pagination.total;

  return (
    <main className="mx-auto max-w-[880px] overflow-hidden px-[48px] pb-[67px] pt-[52px]">
      <div className="flex items-center gap-[11px] text-[20px] font-[700] tracking-[-0.025em] text-[#99a8c2]">
        <button className="text-inherit" type="button" onClick={() => onNavigate("/")}>
          Dashboard
        </button>
        <BreadcrumbChevronIcon className="h-[20px] w-[20px]" />
        <span className="text-[#f4f6fb]">History</span>
      </div>

      <h1 className="mt-[16px] text-[64px] font-[700] leading-[0.98] tracking-[-0.055em] text-[#f4f6fb]">
        Detection History
      </h1>
      <p className="mt-[18px] text-[30px] font-[400] leading-[1.35] tracking-[-0.03em] text-[#97a6c1]">
        Review your analyzed food items
      </p>

      <section className="mt-[52px] grid grid-cols-2 gap-[32px]">
        {primaryCards.map((card) => (
          <HistoryMetricCard
            key={card.title}
            icon={card.icon}
            title={card.title}
            value={card.value}
          />
        ))}
      </section>

      <section className="mt-[60px] flex items-center gap-[31px]">
        <div className="flex h-[85px] flex-1 items-center gap-[18px] rounded-[18px] bg-[#1a202c] px-[20px]">
          <SearchIcon className="h-[35px] w-[35px] text-[#f4f6fb]" />
          <input
            className="w-full border-none bg-transparent p-0 text-[34px] font-[400] tracking-[-0.03em] text-[#f4f6fb] placeholder:text-[#55647f] focus:outline-none"
            placeholder="Search history..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <button
          className="flex h-[106px] w-[108px] items-center justify-center rounded-[24px] border border-[#22314f] bg-[#1a202c] text-[#f4f6fb]"
          type="button"
        >
          <SlidersIcon className="h-[40px] w-[40px]" />
        </button>
      </section>

      <section className="mt-[52px] flex items-center gap-[34px]">
        <div className="flex items-center gap-[23px]">
          <SquareIcon className="h-[40px] w-[40px] text-[#c6c1d0]" />
          <span className="text-[26px] font-[500] tracking-[-0.03em] text-[#f4f6fb]">
            Select All
          </span>
        </div>
        <div className="relative flex-1">
          <select
            className="h-[95px] w-full appearance-none rounded-[24px] border border-[#22314f] bg-[#1a202c] px-[38px] text-[38px] font-[500] tracking-[-0.03em] text-[#f4f6fb] focus:outline-none"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as SortValue);
              setPagination((current) => ({ ...current, page: 1 }));
            }}
          >
            <option value="desc">Newest</option>
            <option value="asc">Oldest</option>
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-[30px] top-[34px] h-[28px] w-[28px] text-[#ff9a3d]" />
        </div>
      </section>

      {errorMessage ? (
        <section className="mt-[48px] rounded-[36px] border border-[#5b2430] bg-[#311821] px-[40px] py-[30px] text-[24px] font-[600] leading-[1.45] text-[#ffb4c2]">
          {errorMessage}
        </section>
      ) : null}

      {!errorMessage && !isFetching && historyItems.length === 0 ? (
        <section className="mt-[48px] rounded-[36px] border border-[#22314f] bg-[#1a202c] px-[40px] py-[38px] text-[28px] font-[600] tracking-[-0.03em] text-[#97a6c1]">
          No history available yet
        </section>
      ) : null}

      <section className="mt-[48px] space-y-[43px]">
        {historyItems.map((item) => {
          const primaryFood = item.foods[0];
          const confidence = primaryFood ? Math.round(primaryFood.confidence * 100) : 0;
          const category = primaryFood ? foodCategories[primaryFood.name] ?? "Detected Item" : "Detected Item";

          return (
            <button
              key={item.id}
              className="w-full rounded-[36px] border border-[#22314f] bg-[#1a202c] px-[33px] pb-[41px] pt-[30px] text-left"
              type="button"
              onClick={() => {
                setAnalysis(item);
                onNavigate("/results");
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[33px]">
                  <SquareIcon className="h-[38px] w-[38px] text-[#c6c1d0]" />
                  <span className="text-[24px] font-[600] tracking-[-0.03em] text-[#99a8c2]">
                    {formatHistoryDate(item.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-[38px] text-[#99a8c2]">
                  <button
                    className="text-inherit"
                    type="button"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <RotateCwIcon className="h-[32px] w-[32px]" />
                  </button>
                  <button
                    className="text-[#ff7d85]"
                    type="button"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <TrashIcon className="h-[32px] w-[32px]" />
                  </button>
                </div>
              </div>

              <div className="mt-[42px] flex gap-[31px]">
                <img
                  alt={primaryFood?.name || "History food"}
                  className="h-[128px] w-[128px] rounded-[28px] object-cover"
                  src={item.imageUrl}
                />
                <div className="pt-[4px]">
                  <div className="text-[31px] font-[700] leading-[1.1] tracking-[-0.03em] text-[#f4f6fb]">
                    {primaryFood?.name || "Unknown Item"}
                  </div>
                  <div className="mt-[14px] text-[24px] font-[600] leading-none tracking-[-0.03em] text-[#99a8c2]">
                    {category} • {Math.round(item.weight)}g
                  </div>
                  <div className="mt-[17px] flex items-center gap-[30px]">
                    <div className="flex items-center gap-[10px] text-[24px] font-[700] tracking-[-0.03em] text-[#f4f6fb]">
                      <FireIcon className="h-[24px] w-[24px] text-[#ff9a3d]" />
                      {formatCalories(item.macros.calories)}
                    </div>
                    <div className="flex items-center gap-[10px] text-[24px] font-[700] tracking-[-0.03em] text-[#35d59a]">
                      <TargetIcon className="h-[24px] w-[24px]" />
                      {confidence}% match
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-[34px] grid grid-cols-3 rounded-[26px] bg-[#0f151f] px-[18px] py-[22px]">
                {[
                  { color: "#ff8c2c", label: "Protein", value: formatMacro(item.macros.protein) },
                  { color: "#35d59a", label: "Carbs", value: formatMacro(item.macros.carbs) },
                  { color: "#ff9b44", label: "Fat", value: formatMacro(item.macros.fat) },
                ].map((macro) => (
                  <div key={macro.label} className="text-center">
                    <div
                      className="text-[24px] font-[700] leading-none tracking-[-0.03em]"
                      style={{ color: macro.color }}
                    >
                      {macro.value}
                    </div>
                    <div className="mt-[14px] text-[24px] font-[600] leading-none tracking-[-0.03em] text-[#99a8c2]">
                      {macro.label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-[38px] flex items-center justify-center gap-[16px] text-[#ff7a12]">
                <EyeIcon className="h-[31px] w-[31px]" />
                <span className="text-[24px] font-[700] tracking-[-0.03em]">View Details</span>
              </div>
            </button>
          );
        })}
      </section>

      {hasMore ? (
        <button
          className="mt-[52px] flex h-[84px] w-full items-center justify-center rounded-[26px] border border-[#a6a0a7] bg-transparent text-[25px] font-[700] tracking-[-0.03em] text-[#f4f6fb]"
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

      <div className="flex justify-end pt-[64px]">
        <button
          className="flex h-[96px] min-w-[309px] items-center justify-center gap-[17px] rounded-[48px] bg-[#ff9b44] px-[34px] text-[24px] font-[500] tracking-[-0.03em] text-white"
          type="button"
          onClick={() => onNavigate("/")}
        >
          <CameraIcon className="h-[34px] w-[34px]" />
          Upload Food
        </button>
      </div>
    </main>
  );
};
