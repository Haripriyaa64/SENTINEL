
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import Panel from "../common/Panel";

const severityData = [
  { name: "Critical", value: 8, color: "#ff617e" },
  { name: "High", value: 17, color: "#ffad70" },
  { name: "Medium", value: 32, color: "#f4ca69" },
  { name: "Low", value: 43, color: "#5ce1e6" },
];

export default function SeverityChart({ alerts }) {
  const hasAlerts = Array.isArray(alerts) && alerts.length > 0;

  const counts = hasAlerts
    ? alerts.reduce((result, alert) => {
        const severity = String(alert.severity ?? alert.level ?? "low").toLowerCase();
        const key = severity.includes("critical")
          ? "Critical"
          : severity.includes("high")
            ? "High"
            : severity.includes("medium")
              ? "Medium"
              : "Low";

        result[key] += 1;
        return result;
      }, { Critical: 0, High: 0, Medium: 0, Low: 0 })
    : null;

  const chartData = counts
    ? severityData.map((item) => ({ ...item, value: counts[item.name] }))
    : severityData;

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Panel
      title="Severity distribution"
      eyebrow="THREAT BREAKDOWN"
      className="severity-panel"
    >
      <div className="severity-chart-wrap">
        <div className="severity-donut">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="69%"
                outerRadius="91%"
                paddingAngle={4}
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                {chartData.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#0d1728",
                  border: "1px solid rgba(92,225,230,.2)",
                  borderRadius: 10,
                  color: "#e5eefb",
                  fontSize: 11,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="severity-center">
            <strong>{total}</strong>
            <span>{hasAlerts ? "ALERTS" : "SAMPLE"}</span>
          </div>
        </div>

        <div className="severity-legend">
          {chartData.map((item) => (
            <div className="severity-legend-row" key={item.name}>
              <span className="severity-legend-label">
                <i style={{ background: item.color }} />
                {item.name}
              </span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>

      {!hasAlerts && (
        <p className="chart-disclaimer">
          Example distribution · Waiting for alert data
        </p>
      )}
    </Panel>
  );
}
