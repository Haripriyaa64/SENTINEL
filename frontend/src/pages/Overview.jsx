
import { useState } from "react";
import {
  ShieldAlert,
  Activity,
  Siren,
  Radio,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import PageHeader from "../components/common/PageHeader";
import StatCard from "../components/common/StatCard";
import Panel from "../components/common/Panel";
import StatusBadge from "../components/common/StatusBadge";
import TrafficChart from "../components/charts/TrafficChart";
import SeverityChart from "../components/charts/SeverityChart";
import ThreatMap from "../components/threats/ThreatMap";
import RadarPanel from "../components/threats/RadarPanel";
import AlertTable from "../components/alerts/AlertTable";

const PAGE_SIZE_OPTIONS = [
  { label: "25", value: "25" },
  { label: "50", value: "50" },
  { label: "100", value: "100" },
  { label: "200", value: "200" },
  { label: "All", value: "all" },
];

function readNumber(object, keys) {
  for (const key of keys) {
    const value = object?.[key];

    if (
      value !== undefined &&
      value !== null &&
      Number.isFinite(Number(value))
    ) {
      return Number(value);
    }
  }

  return null;
}

export default function Overview({
  alerts = [],
  stats = {},
  apiOnline = false,
  loading = false,
  error = "",
  onRefresh,
}) {
  const [pageSize, setPageSize] = useState("25");
  const [page, setPage] = useState(1);

  const criticalFromAlerts = alerts.filter((alert) =>
    String(alert.severity ?? alert.level ?? "")
      .toLowerCase()
      .includes("critical")
  ).length;

  const criticalCount = readNumber(stats, [
    "critical_alerts",
    "critical",
    "critical_count",
  ]) ?? readNumber(stats.by_severity, ["Critical"]);

  const highCount = readNumber(stats, [
    "high_alerts",
    "high",
    "high_count",
  ]) ?? readNumber(stats.by_severity, ["High"]);

  const totalCount = readNumber(stats, [
    "total_alerts",
    "total",
    "total_count",
    "count",
  ]);

  const resolvedCount = readNumber(stats, [
    "resolved_alerts",
    "resolved",
    "resolved_count",
  ]);

  const pageSizeNumber =
    pageSize === "all" ? Math.max(alerts.length, 1) : Number(pageSize);

  const pageCount = Math.max(
    1,
    Math.ceil(alerts.length / pageSizeNumber)
  );

  const currentPage = Math.min(page, pageCount);

  const startIndex =
    alerts.length === 0 ? 0 : (currentPage - 1) * pageSizeNumber;

  const endIndex = Math.min(
    startIndex + pageSizeNumber,
    alerts.length
  );

  const displayedAlerts =
    pageSize === "all"
      ? alerts
      : alerts.slice(startIndex, endIndex);

  const metrics = [
    {
      title: "Total alerts",
      value: totalCount ?? alerts.length,
      detail:
        totalCount === null
          ? "Loaded alert records"
          : "Total records reported by backend",
      icon: ShieldAlert,
      color: "cyan",
    },
    {
      title: "Critical threats",
      value: criticalCount ?? criticalFromAlerts,
      detail: "Critical-severity events",
      icon: Siren,
      color: "red",
    },
    {
      title: "High severity",
      value: highCount ?? "—",
      detail:
        highCount === null
          ? "Not provided by API"
          : "Reported by backend",
      icon: Activity,
      color: "orange",
    },
    {
      title: "Resolved alerts",
      value: resolvedCount ?? "—",
      detail:
        resolvedCount === null
          ? "Not provided by API"
          : "Reported by backend",
      icon: Radio,
      color: "violet",
    },
  ];

  function handlePageSizeChange(event) {
    setPageSize(event.target.value);
    setPage(1);
  }

  function goToPage(nextPage) {
    setPage(Math.min(Math.max(nextPage, 1), pageCount));
  }

  return (
    <div className="page-content">
      <PageHeader
        eyebrow="SECURITY OPERATIONS CENTER"
        title="Security"
        accent="Overview"
        description="Monitor detection events, review alert severity, and inspect your security environment."
        actions={
          <button
            className="primary-action"
            onClick={onRefresh}
            disabled={loading}
          >
            <Activity size={15} />
            {loading ? "Loading..." : "Refresh data"}
          </button>
        }
      />

      {error && (
        <div className="api-warning">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="overview-status-strip">
        <div className="overview-status-copy">
          <span
            className={`overview-status-dot ${
              apiOnline ? "online" : ""
            }`}
          />
          <span>
            {apiOnline
              ? "Backend connection available"
              : "Backend connection unavailable"}
          </span>
        </div>

        <StatusBadge
          status={apiOnline ? "online" : "offline"}
          pulse={apiOnline}
        />
      </div>

      <div className="stats-grid">
        {metrics.map((metric, index) => (
          <StatCard
            key={metric.title}
            {...metric}
            delay={index * 0.06}
          />
        ))}
      </div>

      <div className="dashboard-grid dashboard-grid--main">
        <TrafficChart />
        <SeverityChart alerts={alerts} />
      </div>

      <div className="dashboard-grid dashboard-grid--visuals">
        <ThreatMap alertCount={alerts.length} />
        <RadarPanel alertCount={alerts.length} />
      </div>

      <Panel
        title="Latest detected events"
        eyebrow="ALERT QUEUE"
        action={
          <span className="subtle-count">
            {totalCount ?? alerts.length} total alerts
          </span>
        }
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            padding: "16px",
          }}
        >
          <div>
            <label
              htmlFor="alert-page-size"
              style={{ marginRight: "10px" }}
            >
              Show:
            </label>

            <select
              id="alert-page-size"
              value={pageSize}
              onChange={handlePageSizeChange}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border, #334155)",
                background: "var(--panel, #0f172a)",
                color: "inherit",
              }}
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <span style={{ marginLeft: "8px" }}>
              per page
            </span>
          </div>

          <span className="subtle-count">
            {alerts.length === 0
              ? "Showing 0 alerts"
              : `Showing ${startIndex + 1}–${endIndex} of ${alerts.length} loaded alerts`}
          </span>
        </div>

        <AlertTable
          alerts={displayedAlerts}
          loading={loading}
          compact
        />

        {pageSize !== "all" && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              gap: "12px",
              padding: "16px",
            }}
          >
            <button
              type="button"
              className="primary-action"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <span>
              Page {currentPage} of {pageCount}
            </span>

            <button
              type="button"
              className="primary-action"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= pageCount || loading}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {totalCount !== null && totalCount > alerts.length && (
          <p style={{ padding: "0 16px 16px", fontSize: "12px" }}>
            The backend reports {totalCount} total alerts, but only{" "}
            {alerts.length} have been loaded. Increase the backend/API
            retrieval limit to display the remaining alerts.
          </p>
        )}
      </Panel>

      <p className="data-integrity-note">
        Traffic and radar graphics are illustrative. Only values returned
        by the backend or derived from returned alert records represent
        your current data.
      </p>
    </div>
  );
}
