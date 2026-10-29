
import { motion } from "framer-motion";
import {
  Activity,
  Shield,
  LayoutDashboard,
  BellRing,
  Radio,
  Globe2,
  FileBarChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
} from "lucide-react";

const navigation = [
  { label: "Overview", icon: LayoutDashboard, page: "overview" },
  { label: "IDS Alerts", icon: BellRing, page: "alerts", badge: true },
  { label: "Sensors", icon: Radio, page: "sensors" },
  { label: "Threat Intelligence", icon: Globe2, page: "threats" },
  { label: "Reports", icon: FileBarChart, page: "reports" },
];

export default function Sidebar({
  activePage = "overview",
  onNavigate,
  collapsed = false,
  onToggle,
  mobileOpen = false,
  onClose,
}) {
  return (
    <>
      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}

      <motion.aside
        className={[
          "sidebar",
          collapsed ? "sidebar--collapsed" : "",
          mobileOpen ? "sidebar--mobile-open" : "",
        ].join(" ")}
        initial={false}
        animate={{ width: collapsed ? 84 : 252 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
      >
        <div className="sidebar-brand">
          <div className="brand-mark">
            <Shield size={23} strokeWidth={1.8} />
            <span className="brand-mark__pulse" />
          </div>

          {!collapsed && (
            <div className="brand-copy">
              <strong>SENTINEL<span>.</span></strong>
              <small>SECURITY OPERATIONS</small>
            </div>
          )}

          <button
            className="sidebar-mobile-close"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-section-label">
          {!collapsed && "WORKSPACE"}
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.page;

            return (
              <button
                key={item.page}
                type="button"
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={`nav-item ${active ? "nav-item--active" : ""}`}
                onClick={() => {
                  onNavigate?.(item.page);
                  onClose?.();
                }}
              >
                <Icon size={19} strokeWidth={active ? 2.1 : 1.7} />
                {!collapsed && <span>{item.label}</span>}

                {item.badge && !collapsed && (
                  <span className="nav-item__indicator" />
                )}

                {active && <span className="nav-item__active-line" />}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-status">
            <div className="sidebar-status__icon">
              <ShieldCheck size={17} />
            </div>

            {!collapsed && (
              <div className="sidebar-status__copy">
                <strong>System protected</strong>
                <span><i /> Monitoring workspace</span>
              </div>
            )}
          </div>

          <button
            className="nav-item sidebar-settings"
            type="button"
            title={collapsed ? "Settings" : undefined}
            onClick={() => onNavigate?.("settings")}
          >
            <Settings size={19} strokeWidth={1.7} />
            {!collapsed && <span>Settings</span>}
          </button>

          <button
            className="sidebar-collapse"
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            {!collapsed && <span>Collapse sidebar</span>}
          </button>

          {!collapsed && (
            <div className="sidebar-version">
              <Activity size={13} />
              SENTINEL SOC <span>·</span> v1.0
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
