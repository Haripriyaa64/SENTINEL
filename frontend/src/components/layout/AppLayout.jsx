
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const pageNames = {
  overview: "Overview",
  alerts: "IDS Alerts",
  sensors: "Sensors",
  threats: "Threat Intelligence",
  reports: "Reports",
  settings: "Settings",
};

export default function AppLayout({
  children,
  activePage = "overview",
  onNavigate,
  apiOnline = false,
  refreshing = false,
  lastUpdated,
  onRefresh,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function navigate(page) {
    onNavigate?.(page);
    setMobileOpen(false);
  }

  return (
    <div className="app-shell">
      <div className="ambient-glow ambient-glow--one" />
      <div className="ambient-glow ambient-glow--two" />

      <Sidebar
        activePage={activePage}
        onNavigate={navigate}
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className={`app-main ${collapsed ? "app-main--expanded" : ""}`}>
        <Topbar
          pageTitle={pageNames[activePage] ?? "Workspace"}
          apiOnline={apiOnline}
          refreshing={refreshing}
          lastUpdated={lastUpdated}
          onRefresh={onRefresh}
          onMenu={() => setMobileOpen(true)}
        />

        <main className="app-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              className="page-transition"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.18 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>

          <footer className="app-footer">
            <span><i /> SENTINEL monitoring services</span>
            <span>Last sync: {lastUpdated ? lastUpdated.toLocaleTimeString() : "Not synced"}</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
