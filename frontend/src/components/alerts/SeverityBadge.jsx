
const severityConfig = {
  critical: { label: "Critical", className: "severity-critical" },
  high: { label: "High", className: "severity-high" },
  medium: { label: "Medium", className: "severity-medium" },
  low: { label: "Low", className: "severity-low" },
  info: { label: "Info", className: "severity-info" },
};

export default function SeverityBadge({ severity = "low" }) {
  const key = String(severity).toLowerCase();
  const config = severityConfig[key] ?? severityConfig.low;

  return (
    <span className={`severity-badge ${config.className}`}>
      <span className="severity-badge__dot" />
      {config.label}
    </span>
  );
}
