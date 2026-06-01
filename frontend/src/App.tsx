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

const getPathname = () => window.location.pathname || "/";

function App() {
  const [pathname, setPathname] = useState(getPathname());

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
    <div className="min-h-screen bg-background flex flex-row font-sans relative">
      <Sidebar currentPath={pathname} onNavigate={navigate} />

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
          <PantryPage />
        ) : pathname === "/workouts" ? (
          <WorkoutPage onNavigate={navigate} />
        ) : (
          <DashboardPage onUploadSuccess={() => navigate("/results")} onNavigate={navigate} />
        )}
      </main>
      <PWAInstallBanner />
      <ChatAssistant />
    </div>
  );
}

export default App;
