import { ChartBarsIcon, HistoryIcon, HomeIcon, InsightsSparkIcon, LogoIcon, ProfileIcon, SquareIcon } from "./icons";

type AppHeaderProps = {
  currentPath: string;
  onNavigate: (nextPath: string) => void;
};

const navItems = [
  { name: "Dashboard", path: "/", icon: SquareIcon },
  { name: "Results", path: "/results", icon: ChartBarsIcon },
  { name: "History", path: "/history", icon: HistoryIcon },
  { name: "Insights", path: "/insights", icon: InsightsSparkIcon },
  { name: "Profile", path: "/profile", icon: ProfileIcon },
];

export const AppHeader = ({ currentPath, onNavigate }: AppHeaderProps) => (
  <header className="h-[72px] border-b border-panelBorder bg-background px-8 flex-shrink-0 z-10 sticky top-0">
    <div className="mx-auto flex h-full max-w-7xl items-center justify-between">
      <div 
        className="flex items-center gap-3 cursor-pointer" 
        onClick={() => onNavigate("/")}
      >
        <LogoIcon className="h-8 w-8 text-primary" />
        <div className="flex flex-col">
          <span className="text-lg font-bold leading-tight tracking-tight text-textMain">
            NutriVision
          </span>
          <span className="text-xs font-medium leading-tight text-textMuted">
            Analytics
          </span>
        </div>
      </div>
      
      <nav className="flex items-center gap-2">
        {navItems.map((item) => {
          const isActive = currentPath === item.path || (currentPath === "/" && item.path === "/");
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? "text-textMain bg-panel/50" 
                  : "text-textMuted hover:text-textMain hover:bg-panel/30"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </button>
          );
        })}
      </nav>
    </div>
  </header>
);
