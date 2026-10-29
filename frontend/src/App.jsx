
import { useState } from "react";
import AppLayout from "./components/layout/AppLayout";
import useDashboardData from "./hooks/useDashboardData";

import Overview from "./pages/Overview";
import IDSAlerts from "./pages/IDSAlerts";
import Sensors from "./pages/Sensors";
import ThreatIntelligence from "./pages/ThreatIntelligence";
import Reports from "./pages/Reports";

export default function App() {
  const [activePage, setActivePage] = useState("overview");
  const dashboard = useDashboardData();

  const {
    alerts,
    stats,
    apiOnline,
    loading,
    refreshing,
    error,
    lastUpdated,
    refresh,
  } = dashboard;

  function renderPage() {
    switch (activePage) {
      case "alerts":
        return <IDSAlerts alerts={alerts} loading={loading} />;

      case "sensors":
        return <Sensors apiOnline={apiOnline} />;

      case "threats":
        return <ThreatIntelligence alerts={alerts} />;

      case "reports":
        return <Reports alerts={alerts} />;

      case "settings":
        return (
          <div className="page-content">
            <h1>Workspace <span>Settings</span></h1>
            <p className="settings-description">
              Current API base URL: <code>{import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}</code>
            </p>
            <p className="settings-description">
              Configure the API URL in your frontend .env file, then restart Vite.
            </p>
          </div>
        );

      case "overview":
      default:
        return (
          <Overview
            alerts={alerts}
            stats={stats}
            apiOnline={apiOnline}
            loading={loading}
            error={error}
            onRefresh={refresh}
          />
        );
    }
  }

  return (
    <AppLayout
      activePage={activePage}
      onNavigate={setActivePage}
      apiOnline={apiOnline}
      refreshing={refreshing}
      lastUpdated={lastUpdated}
      onRefresh={refresh}
    >
      {renderPage()}
    </AppLayout>
  );
}
