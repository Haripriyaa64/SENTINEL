
import { Bell, Search, Menu, RefreshCw, Command } from "lucide-react";
import StatusBadge from "../common/StatusBadge";

export default function Topbar({
  apiOnline = false,
  refreshing = false,
  lastUpdated,
  onRefresh,
  onMenu,
  pageTitle = "Overview",
}) {
  const updatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "Waiting for data";

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="icon-button topbar-menu"
          onClick={onMenu}
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        <div className="topbar-breadcrumb">
          <span>Workspace</span>
          <span className="breadcrumb-separator">/</span>
          <strong>{pageTitle}</strong>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-search">
          <Search size={16} />
          <span>Search workspace</span>
          <kbd><Command size={11} /> K</kbd>
        </div>

        <div className="topbar-connection">
          <span className={`connection-indicator ${apiOnline ? "is-online" : ""}`} />
          <span>{apiOnline ? "API Connected" : "API Offline"}</span>
        </div>

        <button
          className="icon-button refresh-button"
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh dashboard"
          aria-label="Refresh dashboard"
        >
          <RefreshCw
            size={17}
            className={refreshing ? "spin-animation" : ""}
          />
        </button>

        <button
          className="icon-button notification-button"
          title="Notifications"
          aria-label="Notifications"
          onClick={() => window.dispatchEvent(new CustomEvent("sentinel:notifications"))}
        >
          <Bell size={18} />
          <span className="notification-dot" />
        </button>

        <div className="topbar-divider" />

        <div className="topbar-profile" title="Security analyst workspace">
          <div className="profile-avatar">SA</div>
          <div className="profile-copy">
            <strong>Security Analyst</strong>
            <span><StatusBadge status={apiOnline ? "online" : "offline"} /></span>
          </div>
        </div>
      </div>
    </header>
  );
}
