import { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { DashboardPage } from "./pages/DashboardPage";
import { HistoryPage } from "./pages/HistoryPage";
import { InsightsPage } from "./pages/InsightsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ResultsPage } from "./pages/ResultsPage";
import { DietPlanPage } from "./pages/DietPlanPage";
import { PantryPage } from "./pages/PantryPage";
import { WorkoutPage } from "./pages/WorkoutPage";
import { PWAInstallBanner } from "./components/PWAInstallBanner";
import { ChatAssistant } from "./components/ChatAssistant";
import { ToastProvider } from "./components/Toast";

const getPathname = () => window.location.pathname || "/";

function App() {
  const [pathname, setPathname] = useState(getPathname());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => setPathname(getPathname());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (nextPath: string) => {
    window.history.pushState({}, "", nextPath);
    setPathname(nextPath);
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans relative">

        {/* ── Mobile top bar (hidden on desktop) ── */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-border sticky top-0 z-30 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="flex flex-col gap-[5px] justify-center items-center w-9 h-9 rounded-xl hover:bg-[#F5F5F0] transition-all"
          >
            <span className="block w-5 h-[2px] bg-textHeading rounded-full" />
            <span className="block w-5 h-[2px] bg-textHeading rounded-full" />
            <span className="block w-3.5 h-[2px] bg-textHeading rounded-full self-start" />
          </button>
          <img src="/nutrixa-logo.png" alt="Nutrixa" className="w-7 h-7 object-contain rounded-lg" />
          <span className="text-base font-bold text-textHeading tracking-tight">Nutrixa</span>
        </header>

        {/* ── Sidebar: always visible on desktop, slide-in drawer on mobile ── */}
        <Sidebar
          currentPath={pathname}
          onNavigate={navigate}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* ── Main content ── */}
        <main className="flex-1 min-h-screen overflow-y-auto">
          {pathname === "/results" ? (
            <ResultsPage onBack={() => navigate("/")} onNavigate={navigate} />
          ) : pathname === "/insights" ? (
            <InsightsPage onNavigate={navigate} />
          ) : pathname === "/history" ? (
            <HistoryPage onNavigate={navigate} />
          ) : pathname === "/profile" ? (
            <ProfilePage onNavigate={navigate} />
          ) : pathname === "/diet-plan" ? (
            <DietPlanPage />
          ) : pathname === "/pantry" ? (
            <PantryPage onNavigate={navigate} />
          ) : pathname === "/workouts" ? (
            <WorkoutPage onNavigate={navigate} />
          ) : (
            <DashboardPage onUploadSuccess={() => navigate("/results")} onNavigate={navigate} />
          )}
        </main>

        <PWAInstallBanner />
        <ChatAssistant />
      </div>
    </ToastProvider>
  );
}

export default App;
