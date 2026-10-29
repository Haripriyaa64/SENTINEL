import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity, AlertOctagon, AlertTriangle, ArrowDownRight,
  ArrowUpRight, Bell, CheckCircle2, ChevronDown, CircleDot,
  Clock3, Crosshair, Database, Eye, FileText, Globe2,
  LayoutDashboard, LockKeyhole, Menu, Network, Radar,
  RefreshCw, Search, Server, Shield, ShieldAlert,
  ShieldCheck, Signal, Target, Wifi, X, Zap
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import "./styles.css";

const API = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "");

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "alerts", label: "IDS Alerts", icon: ShieldAlert },
  { id: "sensors", label: "Sensors", icon: Network },
  { id: "intel", label: "Threat Intelligence", icon: Eye },
  { id: "reports", label: "Reports", icon: FileText },
];

const SEVERITY_COLORS = {
  critical: "#ff5578",
  high: "#ff9b62",
  medium: "#f4ca69",
  low: "#56d9b5",
  info: "#67b9ff",
};

const DEMO_TRAFFIC = [
  { time: "00:00", inbound: 28, outbound: 16 },
  { time: "02:00", inbound: 19, outbound: 12 },
  { time: "04:00", inbound: 34, outbound: 21 },
  { time: "06:00", inbound: 27, outbound: 18 },
  { time: "08:00", inbound: 48, outbound: 29 },
  { time: "10:00", inbound: 39, outbound: 23 },
  { time: "12:00", inbound: 62, outbound: 35 },
  { time: "14:00", inbound: 46, outbound: 31 },
  { time: "16:00", inbound: 76, outbound: 43 },
  { time: "18:00", inbound: 57, outbound: 37 },
  { time: "20:00", inbound: 83, outbound: 51 },
  { time: "22:00", inbound: 65, outbound: 39 },
];

const DEMO_DISTRIBUTION = [
  { name: "Critical", value: 12, color: "#ff5578" },
  { name: "High", value: 24, color: "#ff9b62" },
  { name: "Medium", value: 36, color: "#f4ca69" },
  { name: "Low", value: 28, color: "#56d9b5" },
];

function getSeverity(alert) {
  return String(
    alert.severity ?? alert.level ?? alert.priority ?? "medium"
  ).toLowerCase();
}

function getAlertTitle(alert) {
  return (
    alert.title ??
    alert.name ??
    alert.signature ??
    alert.message ??
    alert.rule_name ??
    "IDS alert"
  );
}

function getAlertId(alert, index = 0) {
  return alert.id ?? alert.alert_id ?? alert.event_id ?? index;
}

function getAlertTime(alert) {
  const value =
    alert.timestamp ?? alert.created_at ?? alert.time ?? alert.detected_at;

  if (!value) return "Time unavailable";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString([], {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function getAlertSource(alert) {
  return (
    alert.source_ip ??
    alert.src_ip ??
    alert.source ??
    alert.src_addr ??
    "Unknown source"
  );
}

function getAlertDestination(alert) {
  return (
    alert.destination_ip ??
    alert.dest_ip ??
    alert.destination ??
    alert.dest_addr ??
    "Unknown destination"
  );
}

function getAlertArray(payload) {
  if (Array.isArray(payload)) return payload;
  return (
    payload?.items ??
    payload?.alerts ??
    payload?.results ??
    payload?.data?.items ??
    payload?.data?.alerts ??
    []
  );
}

function severityLabel(value) {
  const text = String(value || "medium");
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function PanelHeading({ eyebrow, title, action }) {
  return (
    <div className="panel-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h3>{title}</h3>
      </div>
      {action}
    </div>
  );
}

function StatusDot({ status = "online" }) {
  return (
    <span className={`status-dot ${String(status).toLowerCase()}`} />
  );
}

function StatCard({ title, value, detail, icon: Icon, color, trend }) {
  return (
    <motion.div
      className="stat-card glass-panel"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -3 }}
    >
      <div className="stat-top">
        <span className="stat-label">{title}</span>
        <span className={`stat-icon ${color}`}>
          <Icon size={18} />
        </span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-bottom">
        <span className="stat-detail">{detail}</span>
        {trend && (
          <span className={`stat-trend ${trend.startsWith("-") ? "down" : "up"}`}>
            {trend.startsWith("-") ? (
              <ArrowDownRight size={14} />
            ) : (
              <ArrowUpRight size={14} />
            )}
            {trend}
          </span>
        )}
      </div>
      <div className={`stat-glow ${color}`} />
    </motion.div>
  );
}

/* Decorative threat map.
   Markers are illustrative until backed by geolocated alert data. */
function ThreatMap({ alerts = [] }) {
  const markers = useMemo(() => {
    const known = [
      { x: 21, y: 31, label: "North America" },
      { x: 48, y: 24, label: "Europe" },
      { x: 55, y: 40, label: "Middle East" },
      { x: 75, y: 34, label: "East Asia" },
      { x: 67, y: 66, label: "South Asia" },
      { x: 31, y: 70, label: "South America" },
    ];
    return known.slice(0, Math.min(known.length, Math.max(4, alerts.length)));
  }, [alerts.length]);

  return (
    <div className="threat-map">
      <div className="map-grid" />
      <svg
        className="world-map-svg"
        viewBox="0 0 900 430"
        role="img"
        aria-label="Stylized world map visualization"
      >
        <defs>
          <linearGradient id="landGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#183a50" />
            <stop offset="100%" stopColor="#102437" />
          </linearGradient>
          <filter id="mapGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g
          fill="url(#landGradient)"
          stroke="#2c6076"
          strokeWidth="1.3"
          opacity=".94"
        >
          <path d="M70 82 L115 51 168 48 203 68 250 71 274 102 255 126 226 133 212 157 185 165 170 197 148 187 139 155 112 137 93 112Z" />
          <path d="M210 190 L245 202 262 234 250 269 230 305 221 350 203 378 187 347 191 308 174 272 180 232Z" />
          <path d="M370 83 L402 61 438 69 454 87 441 105 411 109 394 99Z" />
          <path d="M410 119 L451 105 483 119 504 150 491 185 475 219 457 246 439 229 426 197 410 174 398 144Z" />
          <path d="M467 70 L513 48 570 49 615 62 654 53 710 74 751 102 785 124 766 147 725 149 698 173 670 160 646 137 613 132 588 112 552 123 521 103 489 102Z" />
          <path d="M685 175 L721 170 750 192 746 223 727 242 700 228 681 203Z" />
          <path d="M772 282 L804 273 830 294 819 318 793 325 774 306Z" />
          <path d="M315 88 L334 76 350 88 344 111 328 117Z" />
        </g>

        <g fill="none" stroke="#36748a" strokeWidth=".6" opacity=".42">
          {[70, 140, 210, 280, 350, 420, 490, 560, 630, 700, 770, 840].map(
            (x) => <path key={x} d={`M${x} 20 V410`} />
          )}
          {[65, 125, 185, 245, 305, 365].map(
            (y) => <path key={y} d={`M35 ${y} H865`} />
          )}
        </g>

        {markers.map((marker, index) => {
          const x = marker.x * 9;
          const y = marker.y * 4.3;
          return (
            <g key={marker.label} transform={`translate(${x},${y})`}>
              <circle r="20" fill="#ff5578" opacity=".08" />
              <circle r="10" fill="none" stroke="#ff6686" opacity=".45">
                <animate
                  attributeName="r"
                  values="5;21;5"
                  dur={`${2.5 + index * 0.3}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values=".8;0;.8"
                  dur={`${2.5 + index * 0.3}s`}
                  repeatCount="indefinite"
                />
              </circle>
              <circle r="3.5" fill="#ff6686" filter="url(#mapGlow)" />
            </g>
          );
        })}

        <g
          fill="none"
          stroke="#3ccadf"
          strokeWidth="1.2"
          strokeDasharray="5 6"
          opacity=".75"
        >
          <path d="M190 134 Q330 40 470 120" />
          <path d="M470 120 Q590 80 700 144" />
          <path d="M700 144 Q660 190 600 280" />
          <path d="M190 134 Q230 245 230 305" />
        </g>
      </svg>

      <div className="map-overlay map-overlay-top">
        <span className="map-tag"><Globe2 size={13} /> GLOBAL ACTIVITY</span>
        <span className="map-live"><span /> VISUALIZATION</span>
      </div>

      <div className="map-overlay map-overlay-bottom">
        <div>
          <span className="map-metric-label">Monitored endpoints</span>
          <strong>—</strong>
        </div>
        <div>
          <span className="map-metric-label">Mapped locations</span>
          <strong>Illustrative</strong>
        </div>
        <div>
          <span className="map-metric-label">Geo enrichment</span>
          <strong>Not connected</strong>
        </div>
      </div>
    </div>
  );
}

function RadarPanel() {
  return (
    <div className="radar-panel">
      <div className="radar-head">
        <div>
          <div className="eyebrow">SENSOR TELEMETRY</div>
          <h3>Detection radar</h3>
        </div>
        <span className="mini-live"><span /> VISUAL DEMO</span>
      </div>

      <div className="radar-stage">
        <div className="radar-rings">
          <div className="radar-ring ring-one" />
          <div className="radar-ring ring-two" />
          <div className="radar-ring ring-three" />
          <div className="radar-cross horizontal" />
          <div className="radar-cross vertical" />
          <div className="radar-sweep" />
          <span className="radar-blip blip-one" />
          <span className="radar-blip blip-two" />
          <span className="radar-blip blip-three" />
          <span className="radar-center"><Radar size={18} /></span>
        </div>
      </div>

      <div className="radar-footer">
        <div><span className="legend-dot cyan" /> Scan visualization</div>
        <div><span className="legend-dot red" /> Illustrative targets</div>
      </div>
      <div className="radar-note">
        Radar animation is decorative; it does not represent measured range or
        live sensor detections.
      </div>
    </div>
  );
}

function AlertTable({ alerts, loading, onOpenAlerts }) {
  return (
    <div className="table-wrap">
      <table className="alerts-table">
        <thead>
          <tr>
            <th>SEVERITY</th>
            <th>DETECTION</th>
            <th>SOURCE</th>
            <th>DESTINATION</th>
            <th>TIME</th>
          </tr>
        </thead>
        <tbody>
          {loading && alerts.length === 0 ? (
            <tr>
              <td colSpan="5" className="table-empty">
                Loading alerts from the API…
              </td>
            </tr>
          ) : alerts.length === 0 ? (
            <tr>
              <td colSpan="5" className="table-empty">
                <ShieldCheck size={22} />
                <strong>No alerts returned by the API</strong>
                <span>Generate authorized test traffic and verify Suricata.</span>
              </td>
            </tr>
          ) : (
            alerts.slice(0, 6).map((alert, index) => {
              const severity = getSeverity(alert);
              return (
                <tr key={getAlertId(alert, index)}>
                  <td>
                    <span className={`severity-badge ${severity}`}>
                      <span />
                      {severityLabel(severity)}
                    </span>
                  </td>
                  <td>
                    <div className="detection-cell">
                      <span className="detection-icon"><Zap size={14} /></span>
                      <div>
                        <strong>{getAlertTitle(alert)}</strong>
                        <small>Event #{getAlertId(alert, index)}</small>
                      </div>
                    </div>
                  </td>
                  <td className="ip-cell">{getAlertSource(alert)}</td>
                  <td className="ip-cell">{getAlertDestination(alert)}</td>
                  <td className="time-cell">{getAlertTime(alert)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      {alerts.length > 0 && (
        <button className="table-footer-link" onClick={onOpenAlerts}>
          View all alerts <ArrowUpRight size={14} />
        </button>
      )}
    </div>
  );
}

function App() {
  const [page, setPage] = useState("overview");
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({});
  const [apiOnline, setApiOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [query, setQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchDashboard = useCallback(async () => {
    try {
      const [healthResult, alertsResult, statsResult] = await Promise.allSettled([
        fetch(`${API}/health`),
        fetch(`${API}/api/alerts`),
        fetch(`${API}/api/alerts/stats`),
      ]);

      const healthOk =
        healthResult.status === "fulfilled" && healthResult.value.ok;
      setApiOnline(healthOk);

      if (alertsResult.status === "fulfilled" && alertsResult.value.ok) {
        const payload = await alertsResult.value.json();
        setAlerts(getAlertArray(payload));
      } else {
        throw new Error("Could not load alerts from the API.");
      }

      if (statsResult.status === "fulfilled" && statsResult.value.ok) {
        setStats(await statsResult.value.json());
      }

      setLastUpdated(new Date());
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "API request failed."
      );
      setApiOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const timer = setInterval(fetchDashboard, 15000);
    return () => clearInterval(timer);
  }, [fetchDashboard]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const severity = getSeverity(alert);
      const text = [
        getAlertTitle(alert),
        getAlertSource(alert),
        getAlertDestination(alert),
        alert.signature,
      ].join(" ").toLowerCase();

      const matchesQuery = text.includes(query.toLowerCase());
      const matchesSeverity =
        severityFilter === "all" || severity === severityFilter;

      return matchesQuery && matchesSeverity;
    });
  }, [alerts, query, severityFilter]);

  const countBySeverity = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    alerts.forEach((alert) => {
      const severity = getSeverity(alert);
      if (severity in counts) counts[severity] += 1;
    });
    return counts;
  }, [alerts]);

  const totalAlerts =
    stats.total_alerts ??
    stats.total ??
    stats.alert_count ??
    stats.total_count ??
    alerts.length;

  const criticalCount =
    stats.critical_alerts ??
    stats.critical ??
    stats.by_severity?.critical ??
    stats.by_severity?.Critical ??
    countBySeverity.critical;

  const highCount =
    stats.high_alerts ??
    stats.high ??
    stats.by_severity?.high ??
    stats.by_severity?.High ??
    countBySeverity.high;

  const sensorCount =
    stats.active_sensors ??
    stats.sensors_online ??
    stats.sensor_count ??
    "—";

  const pageTitle = NAV.find((item) => item.id === page)?.label ?? "Overview";

  const openAlerts = () => setPage("alerts");

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Shield size={23} /></div>
          <div className="brand-copy">
            <strong>SENTINEL<span>_</span></strong>
            <small>THREAT OPERATIONS</small>
          </div>
          <button
            className="mobile-close icon-button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <div className="workspace-card">
          <div className="workspace-symbol"><Crosshair size={18} /></div>
          <div>
            <strong>Security Center</strong>
            <small>Local lab environment</small>
          </div>
          <ChevronDown size={14} />
        </div>

        <div className="nav-label">MONITORING</div>
        <nav className="main-nav">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${page === id ? "active" : ""}`}
              onClick={() => {
                setPage(id);
                setSidebarOpen(false);
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {id === "alerts" && criticalCount > 0 && (
                <span className="nav-count">{criticalCount}</span>
              )}
              {page === id && <span className="nav-active-line" />}
            </button>
          ))}
        </nav>

        <div className="nav-label infrastructure-label">INFRASTRUCTURE</div>
        <div className="infra-card">
          <div className="infra-line">
            <span className="infra-icon"><Server size={15} /></span>
            <span>FastAPI backend</span>
            <StatusDot status={apiOnline ? "online" : "offline"} />
          </div>
          <div className="infra-line">
            <span className="infra-icon"><Database size={15} /></span>
            <span>Alert database</span>
            <StatusDot status={apiOnline ? "online" : "offline"} />
          </div>
          <div className="infra-line">
            <span className="infra-icon"><Signal size={15} /></span>
            <span>Sensor pipeline</span>
            <StatusDot status="unknown" />
          </div>
        </div>

        <div className="sidebar-bottom">
          <div className="security-note">
            <LockKeyhole size={17} />
            <div>
              <strong>Protected workspace</strong>
              <span>Local development environment</span>
            </div>
          </div>
          <div className="user-profile">
            <div className="avatar">SO</div>
            <div className="user-copy">
              <strong>Security Operator</strong>
              <small>Administrator</small>
            </div>
            <div className="user-status" />
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu icon-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="breadcrumbs">
              <span>Sentinel</span>
              <span className="breadcrumb-separator">/</span>
              <strong>{pageTitle}</strong>
            </div>
          </div>

          <div className="topbar-actions">
            <div className={`connection-pill ${apiOnline ? "connected" : ""}`}>
              <span />
              {apiOnline ? "API Connected" : "API Offline"}
            </div>
            <button
              className="icon-button refresh-button"
              onClick={fetchDashboard}
              title="Refresh data"
              aria-label="Refresh data"
            >
              <RefreshCw size={17} />
            </button>
            <button className="icon-button notification-button" aria-label="Notifications">
              <Bell size={18} />
              <span className="notification-dot" />
            </button>
            <div className="topbar-date">
              <span className="date-label">LAST SYNC</span>
              <strong>
                {lastUpdated
                  ? lastUpdated.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "Waiting"}
              </strong>
            </div>
          </div>
        </header>

        <div className="page-content">
          <section className="page-title-row">
            <div>
              <div className="eyebrow page-eyebrow">
                <span className="eyebrow-line" />
                SECURITY OPERATIONS CENTER
              </div>
              <h1>
                {page === "overview" && <>Threat <span>Overview</span></>}
                {page === "alerts" && <>IDS <span>Alerts</span></>}
                {page === "sensors" && <>Sensor <span>Network</span></>}
                {page === "intel" && <>Threat <span>Intelligence</span></>}
                {page === "reports" && <>Security <span>Reports</span></>}
              </h1>
              <p>
                {page === "overview"
                  ? "Unified visibility into your network security posture."
                  : `Monitor and investigate ${pageTitle.toLowerCase()} for your lab environment.`}
              </p>
            </div>
            <div className="title-actions">
              <div className="environment-pill">
                <span className="environment-dot" />
                LOCAL LAB
                <ChevronDown size={13} />
              </div>
              <button className="primary-button" onClick={fetchDashboard}>
                <RefreshCw size={15} /> Refresh telemetry
              </button>
            </div>
          </section>

          {errorMessage && (
            <div className="api-warning">
              <AlertTriangle size={17} />
              <div>
                <strong>Unable to refresh dashboard data</strong>
                <span>{errorMessage} Check that FastAPI is running at {API}.</span>
              </div>
              <button className="icon-button" onClick={() => setErrorMessage("")} aria-label="Dismiss">
                <X size={16} />
              </button>
            </div>
          )}

          {page === "overview" && (
            <>
              <section className="stats-grid">
                <StatCard
                  title="Total IDS alerts"
                  value={totalAlerts}
                  detail="Records returned by API"
                  icon={Activity}
                  color="cyan"
                />
                <StatCard
                  title="Critical alerts"
                  value={criticalCount}
                  detail="Critical severity records"
                  icon={AlertOctagon}
                  color="red"
                />
                <StatCard
                  title="High severity"
                  value={highCount}
                  detail="High severity records"
                  icon={AlertTriangle}
                  color="orange"
                />
                <StatCard
                  title="Active sensors"
                  value={sensorCount}
                  detail="Reported by backend"
                  icon={Radar}
                  color="violet"
                />
              </section>

              <section className="overview-grid">
                <motion.div
                  className="glass-panel traffic-panel"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <PanelHeading
                    eyebrow="NETWORK OBSERVABILITY"
                    title="Traffic activity"
                    action={
                      <span className="chart-period">
                        <span className="period-dot" /> Illustrative sample
                      </span>
                    }
                  />
                  <div className="chart-legend">
                    <span><i className="legend-line inbound" /> Inbound</span>
                    <span><i className="legend-line outbound" /> Outbound</span>
                  </div>
                  <div className="traffic-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={DEMO_TRAFFIC} margin={{ top: 12, right: 6, left: -18, bottom: 0 }}>
                        <defs>
                          <linearGradient id="inboundFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#40d8eb" stopOpacity=".27" />
                            <stop offset="95%" stopColor="#40d8eb" stopOpacity="0" />
                          </linearGradient>
                          <linearGradient id="outboundFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8c7cff" stopOpacity=".18" />
                            <stop offset="95%" stopColor="#8c7cff" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#243342" strokeDasharray="3 5" vertical={false} />
                        <XAxis dataKey="time" tick={{ fill: "#71849a", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#71849a", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            background: "#101b28",
                            border: "1px solid #2b4052",
                            borderRadius: 10,
                            color: "#eaf4ff",
                            fontSize: 12,
                          }}
                        />
                        <Area type="monotone" dataKey="inbound" stroke="#40d8eb" strokeWidth={2} fill="url(#inboundFill)" />
                        <Area type="monotone" dataKey="outbound" stroke="#8c7cff" strokeWidth={2} fill="url(#outboundFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="chart-disclaimer">
                    <CircleDot size={13} />
                    Sample visualization — replace with measured telemetry to display real traffic.
                  </div>
                </motion.div>

                <motion.div
                  className="glass-panel severity-panel"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                >
                  <PanelHeading
                    eyebrow="ALERT CLASSIFICATION"
                    title="Severity distribution"
                    action={<span className="small-label">API DATA</span>}
                  />
                  <div className="severity-chart">
                    {alerts.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.entries(countBySeverity)
                              .filter(([, value]) => value > 0)
                              .map(([name, value]) => ({
                                name,
                                value,
                                color: SEVERITY_COLORS[name],
                              }))}
                            dataKey="value"
                            nameKey="name"
                            innerRadius="67%"
                            outerRadius="88%"
                            paddingAngle={4}
                            stroke="none"
                          >
                            {Object.entries(countBySeverity)
                              .filter(([, value]) => value > 0)
                              .map(([name]) => (
                                <Cell key={name} fill={SEVERITY_COLORS[name]} />
                              ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: "#101b28",
                              border: "1px solid #2b4052",
                              borderRadius: 10,
                              color: "#eaf4ff",
                              fontSize: 12,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="empty-donut">
                        <div className="empty-donut-ring">
                          <Shield size={27} />
                          <strong>—</strong>
                          <span>NO DATA</span>
                        </div>
                      </div>
                    )}
                    <div className="donut-center">
                      <span>TOTAL</span>
                      <strong>{alerts.length}</strong>
                      <small>API alerts</small>
                    </div>
                  </div>
                  <div className="severity-legend">
                    {Object.entries(SEVERITY_COLORS)
                      .filter(([name]) => name !== "info")
                      .map(([name, color]) => (
                        <div className="severity-legend-row" key={name}>
                          <span><i style={{ background: color }} />{severityLabel(name)}</span>
                          <strong>{countBySeverity[name]}</strong>
                        </div>
                      ))}
                  </div>
                </motion.div>
              </section>

              <section className="visual-grid">
                <div className="glass-panel map-panel">
                  <PanelHeading
                    eyebrow="GLOBAL THREAT SURFACE"
                    title="Threat activity map"
                    action={<span className="map-status"><Globe2 size={14} /> MAP PREVIEW</span>}
                  />
                  <ThreatMap alerts={alerts} />
                </div>
                <div className="glass-panel radar-card">
                  <RadarPanel />
                </div>
              </section>

              <section className="glass-panel recent-alerts-panel">
                <PanelHeading
                  eyebrow="LIVE DETECTION FEED"
                  title="Recent IDS alerts"
                  action={
                    <button className="text-button" onClick={openAlerts}>
                      View all alerts <ArrowUpRight size={14} />
                    </button>
                  }
                />
                <AlertTable
                  alerts={alerts}
                  loading={loading}
                  onOpenAlerts={openAlerts}
                />
              </section>
            </>
          )}

          {page === "alerts" && (
            <section className="glass-panel full-page-panel">
              <PanelHeading
                eyebrow="DETECTION & RESPONSE"
                title="Alert investigation"
                action={
                  <span className="small-label">{filteredAlerts.length} MATCHING RECORDS</span>
                }
              />
              <div className="alert-filters">
                <label className="search-box">
                  <Search size={16} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search signature, source, destination…"
                  />
                  {query && (
                    <button onClick={() => setQuery("")} aria-label="Clear search">
                      <X size={14} />
                    </button>
                  )}
                </label>
                <select
                  className="filter-select"
                  value={severityFilter}
                  onChange={(event) => setSeverityFilter(event.target.value)}
                >
                  <option value="all">All severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                  <option value="info">Info</option>
                </select>
                <button className="secondary-button" onClick={fetchDashboard}>
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
              <AlertTable
                alerts={filteredAlerts}
                loading={loading}
                onOpenAlerts={() => {}}
              />
            </section>
          )}

          {page === "sensors" && (
            <section className="glass-panel full-page-panel">
              <PanelHeading
                eyebrow="COLLECTION INFRASTRUCTURE"
                title="Sensor health"
                action={<span className="small-label">VERIFY INTEGRATION</span>}
              />
              <div className="sensor-grid">
                {[
                  { name: "FastAPI backend", sub: API, icon: Server, state: apiOnline ? "Reachable" : "Unreachable", online: apiOnline },
                  { name: "Suricata IDS", sub: "Ubuntu sensor / eve.json", icon: ShieldCheck, state: "Not verified by UI", online: false },
                  { name: "Sensor agent", sub: "Alert forwarding service", icon: Signal, state: "Not verified by UI", online: false },
                  { name: "PostgreSQL", sub: "Alert persistence", icon: Database, state: "Check backend readiness", online: false },
                ].map((sensor) => (
                  <div className="sensor-card" key={sensor.name}>
                    <div className="sensor-card-top">
                      <span className="sensor-symbol"><sensor.icon size={20} /></span>
                      <StatusDot status={sensor.online ? "online" : "unknown"} />
                    </div>
                    <h4>{sensor.name}</h4>
                    <p>{sensor.sub}</p>
                    <div className="sensor-card-state">
                      <span>{sensor.state}</span>
                      <span className={`sensor-state-text ${sensor.online ? "good" : ""}`}>
                        {sensor.online ? "ONLINE" : "UNVERIFIED"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="notice-box">
                <Activity size={17} />
                <span>Only the FastAPI health endpoint is checked here. Suricata, agent, and database states require dedicated backend health checks to report accurately.</span>
              </div>
            </section>
          )}

          {page === "intel" && (
            <section className="glass-panel full-page-panel">
              <PanelHeading
                eyebrow="EXTERNAL THREAT CONTEXT"
                title="Threat intelligence"
                action={<span className="small-label">INTEGRATION PENDING</span>}
              />
              <div className="intel-hero">
                <div className="intel-icon"><Eye size={25} /></div>
                <div>
                  <h2>Enrich detections with threat intelligence</h2>
                  <p>
                    Connect a legitimate threat-intelligence feed to correlate
                    domains, IP addresses, hashes, and indicators with IDS alerts.
                  </p>
                </div>
              </div>
              <div className="intel-grid">
                <div className="intel-card">
                  <Globe2 size={21} />
                  <h4>IOC enrichment</h4>
                  <p>Reputation and context for IPs, domains, and file hashes.</p>
                  <span>NOT CONNECTED</span>
                </div>
                <div className="intel-card">
                  <Eye size={21} />
                  <h4>Dark-web monitoring</h4>
                  <p>Requires a lawful, authorized threat-intelligence provider or feed.</p>
                  <span>NOT CONNECTED</span>
                </div>
                <div className="intel-card">
                  <Target size={21} />
                  <h4>Threat correlation</h4>
                  <p>Match external indicators against observed network events.</p>
                  <span>NOT CONNECTED</span>
                </div>
              </div>
              <div className="notice-box">
                <LockKeyhole size={17} />
                <span>No dark-web scanning or external intelligence lookups are performed by this UI yet. This section is a design placeholder.</span>
              </div>
            </section>
          )}

          {page === "reports" && (
            <section className="glass-panel full-page-panel">
              <PanelHeading
                eyebrow="SECURITY POSTURE"
                title="Reports & summaries"
                action={<span className="small-label">CURRENT API SNAPSHOT</span>}
              />
              <div className="report-summary-grid">
                <div className="report-summary">
                  <Activity size={20} />
                  <span>Total returned alerts</span>
                  <strong>{totalAlerts}</strong>
                </div>
                <div className="report-summary">
                  <AlertOctagon size={20} />
                  <span>Critical severity</span>
                  <strong>{criticalCount}</strong>
                </div>
                <div className="report-summary">
                  <AlertTriangle size={20} />
                  <span>High severity</span>
                  <strong>{highCount}</strong>
                </div>
                <div className="report-summary">
                  <Clock3 size={20} />
                  <span>Last successful refresh</span>
                  <strong>{lastUpdated ? lastUpdated.toLocaleTimeString() : "—"}</strong>
                </div>
              </div>
              <div className="notice-box">
                <FileText size={17} />
                <span>These are dashboard summaries, not a downloadable or audited security report. Report generation can be added after the backend data model is confirmed.</span>
              </div>
            </section>
          )}

          <footer className="app-footer">
            <div><span className="footer-led" /> SENTINEL SOC <span className="footer-divider">/</span> LOCAL LAB</div>
            <div>API refresh interval: 15s <span className="footer-divider">•</span> UI preview</div>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;