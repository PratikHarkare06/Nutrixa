import React from "react";

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const getNavItems = (currentPath: string) => {
  const overviewIcon = (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );

  const mealPlannerIcon = (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
      <path d="M7.1 3.6V11.8M5.3 3.6V8.8M8.9 3.6V8.8M7.1 11.8V20.4" strokeLinecap="round" />
      <path d="M15.8 3.6V20.4M18.7 3.6V10.2C18.7 11.57 17.59 12.68 16.22 12.68H15.38" strokeLinecap="round" />
    </svg>
  );

  const analyticsIcon = (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
      <path d="M3 17l4-4 4 2 4-6 4 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const historyIcon = (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const profileIcon = (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
    </svg>
  );

  const pantryIcon = (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 9h6M9 13h4" strokeLinecap="round" />
      <path d="M8 2v4M16 2v4" strokeLinecap="round" />
    </svg>
  );

  const workoutsIcon = (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
      <path d="M6.5 12h11M4 12H2M22 12h-2M6.5 8l-2 4 2 4M17.5 8l2 4-2 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const resultsIcon = (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
      <rect x="4.2" y="10.5" width="3.2" height="8.8" rx="1.3" fill="currentColor" />
      <rect x="10.4" y="5.8" width="3.2" height="13.5" rx="1.3" fill="currentColor" />
      <rect x="16.6" y="8.1" width="3.2" height="11.2" rx="1.3" fill="currentColor" />
    </svg>
  );

  return [
    { path: "/", label: "Overview", icon: overviewIcon },
    ...(currentPath === "/results" ? [{ path: "/results", label: "Results", icon: resultsIcon }] : []),
    { path: "/pantry", label: "Pantry", icon: pantryIcon },
    { path: "/diet-plan", label: "Meal Planner", icon: mealPlannerIcon },
    { path: "/insights", label: "Insights", icon: analyticsIcon },
    { path: "/workouts", label: "Workouts", icon: workoutsIcon },
    { path: "/history", label: "History", icon: historyIcon },
    { path: "/profile", label: "Profile", icon: profileIcon },
  ];
};

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate }) => {
  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath === path) return true;
    return false;
  };

  const navItems = getNavItems(currentPath);
  const brandName = currentPath === "/" ? "Lumina Health" : "NutriTrack";

  const handleViewPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to view the PDF report.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Weekly Health Report - NutriTrack</title>
          <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'DM Sans', sans-serif;
              color: #2C2C2C;
              background-color: #FFFFFF;
              margin: 0;
              padding: 40px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #E2E4DC;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #7A9E7E;
            }
            .title {
              font-size: 28px;
              font-weight: bold;
              margin: 0;
            }
            .date {
              color: #888888;
              font-size: 14px;
              margin-top: 5px;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              border-left: 4px solid #7A9E7E;
              padding-left: 10px;
              margin-bottom: 15px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .grid {
              display: grid;
              grid-template-cols: repeat(2, 1fr);
              gap: 20px;
            }
            .card {
              border: 1px solid #E2E4DC;
              border-radius: 12px;
              padding: 15px;
              background-color: #F6F8F3;
            }
            .card-title {
              font-size: 12px;
              color: #888888;
              font-weight: bold;
              text-transform: uppercase;
            }
            .card-value {
              font-size: 22px;
              font-weight: bold;
              color: #2C2C2C;
              margin-top: 5px;
            }
            .tips-list {
              padding-left: 20px;
              line-height: 1.6;
              font-size: 14px;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 12px;
              color: #888888;
              border-top: 1px solid #E2E4DC;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">Weekly Metabolic Insights</h1>
              <div class="date">Report generated on ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
            </div>
            <div class="logo">NutriTrack</div>
          </div>

          <div class="section">
            <div class="section-title">Metabolic Progress</div>
            <p style="font-size: 15px; line-height: 1.6;">
              Excellent work! Your overall metabolic score has improved by <strong>12%</strong> compared to the previous week. This is driven by your consistent hydration, high protein intake, and structured activity tracking.
            </p>
          </div>

          <div class="section">
            <div class="section-title">Key Performance Indicators</div>
            <div class="grid">
              <div class="card">
                <div class="card-title">Daily Calorie Average</div>
                <div class="card-value">1,735 kcal</div>
              </div>
              <div class="card">
                <div class="card-title">Protein Consistency</div>
                <div class="card-value">85% of goal</div>
              </div>
              <div class="card">
                <div class="card-title">Water Target Progress</div>
                <div class="card-value">2.2L / Day</div>
              </div>
              <div class="card">
                <div class="card-title">Weekly Active Time</div>
                <div class="card-value">5.4 hours</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Clinical Recommendations</div>
            <ul class="tips-list">
              <li>Keep pairing high-fiber grains with raw avocados to maximize fat-soluble vitamin absorption.</li>
              <li>Maintain daily post-workout hydration above 500ml to optimize metabolic recovery cycles.</li>
              <li>Incorporate at least two active recovery days (stretching or walking) during muscle strain phases.</li>
            </ul>
          </div>

          <div class="footer">
            NutriTrack Analytics • Private & Confidential Personal Health Record
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const renderSidebarWidget = () => {
    switch (currentPath) {
      case "/":
        return (
          <div className="mx-3 mb-5 p-4 rounded-2xl bg-[#EBF2EB] border border-[#D4E6D5]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⭐</span>
              <span className="text-sm font-bold text-[#2C3E2B]">7 Day Streak</span>
            </div>
            <div className="w-full bg-[#D4E6D5] rounded-full h-2 mb-2 overflow-hidden">
              <div className="h-full bg-[#7A9E7E] rounded-full" style={{ width: "60%" }} />
            </div>
            <p className="text-xs text-textMuted font-medium">3 days to next badge</p>
          </div>
        );
      case "/diet-plan":
        return (
          <div className="mx-3 mb-5 p-4 rounded-2xl bg-[#F5F6F1] border border-[#E2E4DC] flex flex-col">
            <span className="text-xs font-bold text-[#2C3E2B] mb-1">Personalized AI Chef</span>
            <p className="text-xs text-textMuted mb-3 leading-relaxed">Get custom recipes based on your pantry.</p>
            <button
              onClick={() => onNavigate("/pantry")}
              className="w-full py-2 bg-[#9DB89F] hover:bg-[#7A9E7E] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Try Now
            </button>
          </div>
        );
      case "/insights":
        return (
          <div className="mx-3 mb-5 p-4 rounded-2xl bg-[#F5F6F1] border border-[#E2E4DC] flex flex-col">
            <span className="text-xs font-bold text-[#2C3E2B] mb-1">Weekly Report</span>
            <p className="text-xs text-textMuted mb-3 leading-relaxed">Your metabolic health improved by 12% this week.</p>
            <button
              onClick={handleViewPDF}
              className="w-full py-2 bg-[#9DB89F] hover:bg-[#7A9E7E] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              View PDF
            </button>
          </div>
        );
      case "/pantry":
        return (
          <div className="mx-3 mb-5 p-4 rounded-2xl bg-[#F5F6F1] border border-[#E2E4DC] flex flex-col">
            <span className="text-xs font-bold text-[#2C3E2B] mb-1">Storage Tip</span>
            <p className="text-xs text-textMuted leading-relaxed">Keep potatoes in a cool, dark place to double their shelf life.</p>
          </div>
        );
      case "/workouts":
        return (
          <div className="mx-3 mb-5 p-4 rounded-2xl bg-[#EBF2EB] border border-[#D4E6D5]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔥</span>
              <span className="text-sm font-bold text-[#2C3E2B]">Fitness Streak</span>
            </div>
            <div className="w-full bg-[#D4E6D5] rounded-full h-2 mb-2 overflow-hidden">
              <div className="h-full bg-[#7A9E7E] rounded-full" style={{ width: "70%" }} />
            </div>
            <p className="text-xs text-textMuted font-medium">4 days to gold badge</p>
          </div>
        );
      case "/history":
        return (
          <div className="mx-3 mb-5 p-4 rounded-2xl bg-[#EBF2EB] border border-[#D4E6D5]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🏆</span>
              <span className="text-sm font-bold text-[#2C3E2B]">12 Day Streak</span>
            </div>
            <div className="w-full bg-[#D4E6D5] rounded-full h-2 mb-2 overflow-hidden">
              <div className="h-full bg-[#7A9E7E] rounded-full" style={{ width: "80%" }} />
            </div>
            <p className="text-xs text-textMuted font-medium">Keep it up, Alex!</p>
          </div>
        );
      case "/profile":
        return (
          <div className="mx-3 mb-5 p-4 rounded-2xl bg-[#EBF2EB] border border-[#D4E6D5]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⭐</span>
              <span className="text-sm font-bold text-[#2C3E2B]">7 Day Streak</span>
            </div>
            <div className="w-full bg-[#D4E6D5] rounded-full h-2 mb-2 overflow-hidden">
              <div className="h-full bg-[#7A9E7E] rounded-full" style={{ width: "60%" }} />
            </div>
            <p className="text-xs text-textMuted font-medium">Keep it up, Alex!</p>
          </div>
        );
      case "/results":
        return (
          <div className="mx-3 mb-5 p-4 rounded-2xl bg-[#F5F6F1] border border-[#E2E4DC] flex flex-col">
            <span className="text-xs font-bold text-[#2C3E2B] mb-1">Upgrade to Pro</span>
            <p className="text-xs text-textMuted mb-3 leading-relaxed">Get detailed micronutrient breakdown</p>
            <button
              onClick={() => alert("Pro subscription plan modal...")}
              className="w-full py-2 bg-[#9DB89F] hover:bg-[#7A9E7E] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Learn More
            </button>
          </div>
        );
      default:
        return (
          <div className="mx-3 mb-5 p-4 rounded-2xl bg-[#EBF2EB] border border-[#D4E6D5]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⭐</span>
              <span className="text-sm font-bold text-[#2C3E2B]">7 Day Streak</span>
            </div>
            <div className="w-full bg-[#D4E6D5] rounded-full h-2 mb-2 overflow-hidden">
              <div className="h-full bg-[#7A9E7E] rounded-full" style={{ width: "60%" }} />
            </div>
            <p className="text-xs text-[#2C3E2B] font-medium">Keep it up!</p>
          </div>
        );
    }
  };

  return (
    <aside className="w-[240px] min-h-screen bg-white border-r border-border flex flex-col shrink-0 shadow-sm">
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#7A9E7E] flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 5.25-8 5.25" />
          </svg>
        </div>
        <span className="text-xl font-bold text-textHeading tracking-tight">{brandName}</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 flex flex-col gap-1">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path + item.label}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all text-left
                ${active
                  ? "bg-[#9DB89F] text-white shadow-sm"
                  : "text-textMuted hover:bg-[#F5F5F0] hover:text-textHeading"
                }`}
            >
              <span className={active ? "text-white" : "text-[#888888]"}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Dynamic Streak/Report/Pro Widget */}
      {renderSidebarWidget()}
    </aside>
  );
};
