import { useEffect, useState, lazy, Suspense } from "react";
import { Sidebar } from "./components/Sidebar";
import { PWAInstallBanner } from "./components/PWAInstallBanner";
import { ChatAssistant } from "./components/ChatAssistant";
import { ToastProvider } from "./components/Toast";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Authentication & Onboarding
import { useAuthStore } from "./store/authStore";
import OnboardingWizard from "./components/OnboardingWizard";

// Lazy load pages for bundle size optimization (code splitting)
const DashboardPage = lazy(() => import("./pages/DashboardPage").then(m => ({ default: m.DashboardPage })));
const HistoryPage = lazy(() => import("./pages/HistoryPage").then(m => ({ default: m.HistoryPage })));
const InsightsPage = lazy(() => import("./pages/InsightsPage").then(m => ({ default: m.InsightsPage })));
const ProfilePage = lazy(() => import("./pages/ProfilePage").then(m => ({ default: m.ProfilePage })));
const ResultsPage = lazy(() => import("./pages/ResultsPage").then(m => ({ default: m.ResultsPage })));
const DietPlanPage = lazy(() => import("./pages/DietPlanPage").then(m => ({ default: m.DietPlanPage })));
const PantryPage = lazy(() => import("./pages/PantryPage").then(m => ({ default: m.PantryPage })));
const WorkoutPage = lazy(() => import("./pages/WorkoutPage").then(m => ({ default: m.WorkoutPage })));
const SleepPage = lazy(() => import("./pages/SleepPage").then(m => ({ default: m.SleepPage })));
const AuthPage = lazy(() => import("./pages/AuthPage"));

const getPathname = () => window.location.pathname || "/";

const PageLoader = () => (
  <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F8F9FA]">
    <span className="w-8 h-8 border-4 border-[#7A9E7E]/30 border-t-[#7A9E7E] rounded-full animate-spin mb-4" />
    <p className="text-xs font-bold text-textHeading">Loading page...</p>
  </div>
);

function App() {
  const [pathname, setPathname] = useState(getPathname());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { initAuth, isAuthenticated, user, isLoading } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    const handlePopState = () => setPathname(getPathname());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "unset";
  }, [pathname]);

  const navigate = (nextPath: string) => {
    window.history.pushState({}, "", nextPath);
    setPathname(nextPath);
  };

  // ── Route Guards ──
  const isGuestAllowedPath = pathname === "/" || pathname === "/results" || pathname === "/auth";

  // Redirect to Auth if trying to access gated feature as a guest
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isGuestAllowedPath) {
      navigate("/auth");
    }
  }, [pathname, isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F8F9FA]">
        <span className="w-8 h-8 border-4 border-[#7A9E7E]/30 border-t-[#7A9E7E] rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-textHeading">Loading health data...</p>
      </div>
    );
  }

  if (!isAuthenticated && !isGuestAllowedPath) {
    return (
      <Suspense fallback={<PageLoader />}>
        <AuthPage navigate={navigate} />
      </Suspense>
    );
  }

  if (pathname === "/auth") {
    return (
      <Suspense fallback={<PageLoader />}>
        <AuthPage navigate={navigate} />
      </Suspense>
    );
  }

  return (
    <ErrorBoundary>
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
            <Suspense fallback={<PageLoader />}>
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
              ) : pathname === "/sleep" ? (
                <SleepPage />
              ) : (
                <DashboardPage onUploadSuccess={() => navigate("/results")} onNavigate={navigate} />
              )}
            </Suspense>
          </main>

          <PWAInstallBanner />
          <ChatAssistant />

          {/* ── Onboarding Wizard overlay ── */}
          {isAuthenticated && user && !user.hasCompletedProfile && (
            <OnboardingWizard onComplete={() => navigate("/")} />
          )}
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
