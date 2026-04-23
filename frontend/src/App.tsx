import { useEffect, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { DashboardPage } from "./pages/DashboardPage";
import { HistoryPage } from "./pages/HistoryPage";
import { InsightsPage } from "./pages/InsightsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ResultsPage } from "./pages/ResultsPage";

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
    <div className="min-h-screen bg-[#0a0f16] text-[#f4f6fb]">
      {pathname !== "/profile" ? <AppHeader onNavigate={navigate} /> : null}
      {pathname === "/results" ? (
        <ResultsPage onBack={() => navigate("/")} onNavigate={navigate} />
      ) : pathname === "/insights" ? (
        <InsightsPage onNavigate={navigate} />
      ) : pathname === "/history" ? (
        <HistoryPage onNavigate={navigate} />
      ) : pathname === "/profile" ? (
        <ProfilePage onNavigate={navigate} />
      ) : (
        <DashboardPage onUploadSuccess={() => navigate("/results")} />
      )}
    </div>
  );
}

export default App;
