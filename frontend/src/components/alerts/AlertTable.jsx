
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  ShieldAlert,
  Clock3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import Panel from "../common/Panel";
import SeverityBadge from "./SeverityBadge";

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

function getSeverity(alert) {
  return String(
    alert.severity ?? alert.level ?? alert.priority ?? "low"
  ).toLowerCase();
}

function normalizeSeverity(value) {
  if (value.includes("critical")) return "critical";
  if (value.includes("high")) return "high";
  if (value.includes("medium") || value.includes("moderate")) return "medium";
  if (value.includes("info")) return "info";
  return "low";
}

function getAlertId(alert, index) {
  return alert.id ?? alert.alert_id ?? alert.event_id ?? `event-${index}`;
}

function getAlertTitle(alert) {
  return (
    alert.signature ??
    alert.signature_name ??
    alert.rule_name ??
    alert.title ??
    alert.name ??
    alert.message ??
    alert.description ??
    alert.category ??
    "Unclassified security event"
  );
}

function getAlertCategory(alert) {
  return alert.category ?? alert.attack_type ?? alert.rule_category ?? "Unclassified";
}

function getAlertSource(alert) {
  return (
    alert.src_ip ??
    alert.source_ip ??
    alert.source ??
    alert.host ??
    "Unknown"
  );
}

function getAlertDestination(alert) {
  return (
    alert.dest_ip ??
    alert.dst_ip ??
    alert.destination_ip ??
    alert.target_ip ??
    "Unknown"
  );
}

function getAlertTime(alert) {
  const value =
    alert.timestamp ??
    alert.created_at ??
    alert.time ??
    alert.detected_at;

  if (!value) return "Time unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AlertTable({
  alerts = [],
  loading = false,
  onSelectAlert,
  onUpdateStatus,
  compact = false,
}) {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [pageSize, setPageSize] = useState("25");
  const [page, setPage] = useState(1);

  const filteredAlerts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return alerts.filter((alert) => {
      const severity = normalizeSeverity(getSeverity(alert));

      const matchesSeverity =
        severityFilter === "all" || severity === severityFilter;

      const searchableText = [
        getAlertTitle(alert),
        getAlertCategory(alert),
        getAlertSource(alert),
        getAlertDestination(alert),
        alert.description,
        alert.status,
        alert.protocol,
        alert.source_type,
        alert.mitre_id,
        alert.signature_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesSeverity && (!query || searchableText.includes(query));
    });
  }, [alerts, search, severityFilter]);

  const pageSizeNumber =
    pageSize === "all"
      ? Math.max(filteredAlerts.length, 1)
      : Number(pageSize);

  const pageCount = Math.max(
    1,
    Math.ceil(filteredAlerts.length / pageSizeNumber)
  );

  const currentPage = Math.min(page, pageCount);

  const startIndex =
    filteredAlerts.length === 0
      ? 0
      : (currentPage - 1) * pageSizeNumber;

  const endIndex = Math.min(
    startIndex + pageSizeNumber,
    filteredAlerts.length
  );

  const visibleAlerts = compact
    ? filteredAlerts.slice(0, 5)
    : filteredAlerts.slice(startIndex, endIndex);

  function handleSearchChange(event) {
    setSearch(event.target.value);
    setPage(1);
  }

  function handleSeverityChange(event) {
    setSeverityFilter(event.target.value);
    setPage(1);
  }

  function handlePageSizeChange(event) {
    setPageSize(event.target.value);
    setPage(1);
  }

  return (
    <Panel
      title="Security alerts"
      eyebrow="THREAT DETECTION"
      className="alert-table-panel"
      action={
        <span className="alert-count">
          <span />
          {alerts.length} loaded events
        </span>
      }
    >
      <div className="alert-toolbar">
        <label className="alert-search">
          <Search size={15} />
          <input
            type="search"
            placeholder="Search signatures, IPs, categories..."
            value={search}
            onChange={handleSearchChange}
            aria-label="Search security alerts"
          />
        </label>

        <label className="alert-filter">
          <SlidersHorizontal size={14} />
          <select
            value={severityFilter}
            onChange={handleSeverityChange}
            aria-label="Filter alerts by severity"
          >
            <option value="all">All severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>
        </label>
      </div>

      {!compact && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "12px 16px",
          }}
        >
          <label>
            Show{" "}
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              aria-label="Number of alerts per page"
              style={{ padding: "6px 10px", borderRadius: 6 }}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={String(size)}>
                  {size}
                </option>
              ))}
              <option value="all">All</option>
            </select>{" "}
            alerts
          </label>

          <span className="subtle-count">
            {filteredAlerts.length === 0
              ? "No matching events"
              : `Showing ${startIndex + 1}–${endIndex} of ${filteredAlerts.length} matching events`}
          </span>
        </div>
      )}

      <div className="alert-table-scroll">
        <table className="alert-table">
          <thead>
            <tr>
              <th>DETECTION / ATTACK TYPE</th>
              <th>SEVERITY</th>
              <th>SOURCE IP</th>
              <th>DESTINATION IP</th>
              <th>DETECTED</th>
              <th>STATUS</th>
              {!compact && <th aria-label="Actions" />}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={compact ? 6 : 7}>
                  <div className="alert-empty">
                    <span className="loading-spinner" />
                    Loading security events...
                  </div>
                </td>
              </tr>
            ) : visibleAlerts.length === 0 ? (
              <tr>
                <td colSpan={compact ? 6 : 7}>
                  <div className="alert-empty">
                    <ShieldAlert size={23} />
                    <strong>No matching alerts</strong>
                    <span>
                      {alerts.length
                        ? "Try changing your search or severity filter."
                        : "No alert records were returned by the backend."}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              visibleAlerts.map((alert, index) => {
                const id = getAlertId(alert, startIndex + index);
                const severity = normalizeSeverity(getSeverity(alert));
                const status = String(alert.status ?? "New");
                const source = getAlertSource(alert);
                const destination = getAlertDestination(alert);
                const title = getAlertTitle(alert);
                const category = getAlertCategory(alert);
                const mitreId = alert.mitre_id;

                return (
                  <motion.tr
                    key={id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.2,
                      delay: (index % 10) * 0.015,
                    }}
                    className="alert-table-row"
                    onClick={() => onSelectAlert?.(alert)}
                    style={{ cursor: onSelectAlert ? "pointer" : "default" }}
                  >
                    <td>
                      <div className="alert-event-cell">
                        <span
                          className={`alert-event-icon alert-event-icon--${severity}`}
                        >
                          <ShieldAlert size={15} />
                        </span>

                        <div className="alert-event-copy">
                          <strong title={title}>{title}</strong>
                          <span title={category}>
                            {category}
                            {mitreId ? ` · ${mitreId}` : ""}
                          </span>
                          <span>ID: {String(id).slice(0, 18)}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <SeverityBadge severity={severity} />
                    </td>

                    <td>
                      <span className="alert-source" title={source}>
                        {source}
                      </span>
                    </td>

                    <td>
                      <span
                        className="alert-source"
                        title={destination}
                      >
                        {destination}
                      </span>
                    </td>

                    <td>
                      <span className="alert-time">
                        <Clock3 size={12} />
                        {getAlertTime(alert)}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`alert-status alert-status--${status
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")}`}
                      >
                        <i />
                        {status}
                      </span>
                    </td>

                    {!compact && (
                      <td>
                        <button
                          type="button"
                          className="alert-open-button"
                          title="View alert details"
                          aria-label={`View details for ${title}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectAlert?.(alert);
                          }}
                        >
                          <ArrowUpRight size={15} />
                        </button>
                      </td>
                    )}
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!compact && !loading && filteredAlerts.length > 0 && (
        <div
          className="alert-table-footer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <span>
            {filteredAlerts.length} matching events
          </span>

          {pageSize !== "all" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <button
                type="button"
                className="alert-open-button"
                aria-label="Previous page"
                disabled={currentPage <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                <ChevronLeft size={16} />
              </button>

              <span>
                Page {currentPage} of {pageCount}
              </span>

              <button
                type="button"
                className="alert-open-button"
                aria-label="Next page"
                disabled={currentPage >= pageCount}
                onClick={() =>
                  setPage((value) => Math.min(pageCount, value + 1))
                }
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {compact && (
            <span className="alert-table-footer__hint">
              Latest events
            </span>
          )}
        </div>
      )}

      {compact && (
        <div className="alert-table-footer">
          <span>
            Showing {visibleAlerts.length} of {filteredAlerts.length} matching events
          </span>
          <span className="alert-table-footer__hint">
            Latest events
          </span>
        </div>
      )}
    </Panel>
  );
}
