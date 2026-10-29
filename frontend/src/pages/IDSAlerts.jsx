
import { useMemo, useState } from "react";
import {
  Download,
  ShieldAlert,
  Activity,
  Siren,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import PageHeader from "../components/common/PageHeader";
import StatCard from "../components/common/StatCard";
import Panel from "../components/common/Panel";
import AlertTable from "../components/alerts/AlertTable";

const SIGNATURE_COLORS = [
  "#22d3ee",
  "#818cf8",
  "#f59e0b",
  "#34d399",
  "#f472b6",
];

function getSeverity(alert) {
  return String(
    alert.severity ?? alert.level ?? alert.priority ?? "low"
  ).toLowerCase();
}

function getTitle(alert) {
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

function getCategory(alert) {
  return alert.category ?? alert.attack_type ?? "Unclassified";
}

function escapeCsv(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export default function IDSAlerts({
  alerts = [],
  loading = false,
  onSelectAlert,
}) {
  const [exportMessage, setExportMessage] = useState("");

  const counts = useMemo(() => {
    const result = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    for (const alert of alerts) {
      const severity = getSeverity(alert);

      if (severity.includes("critical")) {
        result.critical++;
      } else if (severity.includes("high")) {
        result.high++;
      } else if (
        severity.includes("medium") ||
        severity.includes("moderate")
      ) {
        result.medium++;
      } else if (severity.includes("info")) {
        result.info++;
      } else {
        result.low++;
      }
    }

    return result;
  }, [alerts]);

  const signatureData = useMemo(() => {
    const countsBySignature = new Map();

    for (const alert of alerts) {
      const title = getTitle(alert);
      const existing = countsBySignature.get(title);

      if (existing) {
        existing.value++;
      } else {
        countsBySignature.set(title, {
          name: title,
          value: 1,
          category: getCategory(alert),
        });
      }
    }

    return [...countsBySignature.values()]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((item, index) => ({
        ...item,
        color: SIGNATURE_COLORS[index % SIGNATURE_COLORS.length],
      }));
  }, [alerts]);

  const signatureTotal = signatureData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  function exportAlerts() {
    if (!alerts.length) {
      setExportMessage("There are no alert records to export.");
      return;
    }

    const columns = [
      "id",
      "timestamp",
      "severity",
      "category",
      "description",
      "src_ip",
      "dst_ip",
      "source_type",
      "mitre_id",
      "status",
    ];

    const rows = [
      columns.join(","),
      ...alerts.map((alert) =>
        columns
          .map((key) => escapeCsv(alert[key]))
          .join(",")
      ),
    ];

    const blob = new Blob(["\uFEFF" + rows.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "sentinel-alerts.csv";
    link.click();

    URL.revokeObjectURL(url);

    setExportMessage(
      `CSV export started for ${alerts.length} loaded alerts.`
    );
  }

  return (
    <div className="page-content">
      <PageHeader
        eyebrow="DETECTION & RESPONSE"
        title="IDS"
        accent="Alerts"
        description="Identify detected network events, investigate endpoints, and review security severity."
        actions={
          <button
            className="primary-action"
            onClick={exportAlerts}
            disabled={loading || alerts.length === 0}
          >
            <Download size={15} />
            Export CSV
          </button>
        }
      />

      {exportMessage && (
        <p className="inline-feedback" role="status">
          {exportMessage}
        </p>
      )}

      <div className="stats-grid stats-grid--three">
        <StatCard
          title="All events"
          value={alerts.length}
          detail="Loaded alert records"
          icon={ShieldAlert}
          color="cyan"
        />

        <StatCard
          title="Critical"
          value={counts.critical}
          detail="Critical-severity events"
          icon={Siren}
          color="red"
        />

        <StatCard
          title="High"
          value={counts.high}
          detail="High-severity events"
          icon={Activity}
          color="orange"
        />
      </div>

      <Panel
        title="Top detected signatures"
        eyebrow="DETECTION ANALYTICS"
        action={
          <span className="subtle-count">
            {signatureData.length} signature types
          </span>
        }
      >
        {loading ? (
          <p className="signature-empty">
            Loading detection analytics...
          </p>
        ) : signatureData.length === 0 ? (
          <p className="signature-empty">
            No detection data is available yet.
          </p>
        ) : (
          <div className="signature-donut-layout">
            <div className="signature-donut">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={signatureData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="65%"
                    outerRadius="88%"
                    paddingAngle={3}
                    stroke="none"
                  >
                    {signatureData.map((item) => (
                      <Cell
                        key={item.name}
                        fill={item.color}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value, name) => [
                      `${value} events`,
                      name,
                    ]}
                    contentStyle={{
                      background: "#101b2a",
                      border: "1px solid #26394d",
                      borderRadius: 8,
                      fontSize: 11,
                      maxWidth: 260,
                    }}
                    itemStyle={{ color: "#e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="signature-donut-center">
                <strong>{signatureTotal}</strong>
                <span>TOP 5 EVENTS</span>
              </div>
            </div>

            <div className="signature-legend">
              {signatureData.map((item, index) => {
                const percentage = signatureTotal
                  ? Math.round(
                      (item.value / signatureTotal) * 100
                    )
                  : 0;

                return (
                  <div
                    className="signature-legend-item"
                    key={item.name}
                  >
                    <span
                      className="signature-legend-dot"
                      style={{
                        backgroundColor: item.color,
                      }}
                    />

                    <div className="signature-legend-copy">
                      <span
                        className="signature-legend-name"
                        title={item.name}
                      >
                        {item.name}
                      </span>

                      <div className="signature-legend-track">
                        <span
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>

                      <span className="signature-legend-category">
                        {item.category}
                      </span>
                    </div>

                    <div className="signature-legend-stats">
                      <strong>{item.value}</strong>
                      <span>{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Panel>

      <AlertTable
        alerts={alerts}
        loading={loading}
        onSelectAlert={onSelectAlert}
      />

      <p className="data-integrity-note">
        Signature counts are calculated from loaded alert records.
        Detection signatures describe observed events and do not
        independently prove that an attack succeeded.
      </p>
    </div>
  );
}
