
import { Download, FileBarChart, ShieldAlert } from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import Panel from "../components/common/Panel";

export default function Reports({ alerts = [] }) {
  const critical = alerts.filter((alert) =>
    String(alert.severity ?? alert.level ?? "").toLowerCase().includes("critical")
  ).length;

  const high = alerts.filter((alert) =>
    String(alert.severity ?? alert.level ?? "").toLowerCase().includes("high")
  ).length;

  function downloadReport() {
    const report = {
      report_name: "SENTINEL SOC Alert Summary",
      generated_at: new Date().toISOString(),
      total_alert_records: alerts.length,
      critical_alert_records: critical,
      high_alert_records: high,
      alerts,
      note: "Summary of records returned by the connected backend. This report is not a complete forensic assessment.",
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sentinel-soc-report.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page-content">
      <PageHeader
        eyebrow="REPORTING & AUDIT"
        title="Security"
        accent="Reports"
        description="Generate a downloadable summary from the alert records currently available."
        actions={
          <button className="primary-action" onClick={downloadReport}>
            <Download size={15} /> Generate report
          </button>
        }
      />

      <div className="stats-grid stats-grid--three">
        <div className="glass-panel intelligence-stat">
          <FileBarChart size={20} />
          <span>Records included</span>
          <strong>{alerts.length}</strong>
        </div>
        <div className="glass-panel intelligence-stat">
          <ShieldAlert size={20} />
          <span>Critical records</span>
          <strong>{critical}</strong>
        </div>
        <div className="glass-panel intelligence-stat">
          <ShieldAlert size={20} />
          <span>High-severity records</span>
          <strong>{high}</strong>
        </div>
      </div>

      <Panel title="Alert summary report" eyebrow="REPORT PREVIEW">
        <div className="report-preview">
          <div className="report-preview-icon"><FileBarChart size={25} /></div>
          <div>
            <strong>SENTINEL SOC — Alert Summary</strong>
            <p>
              Includes the alert records returned by your backend, severity
              counts, and a generation timestamp.
            </p>
            <span>Format: JSON · Generated on demand</span>
          </div>
          <button className="secondary-action" onClick={downloadReport}>
            <Download size={14} /> Export
          </button>
        </div>
      </Panel>

      <p className="data-integrity-note">
        The report summarizes available alert data; it does not claim to represent
        every event in your environment.
      </p>
    </div>
  );
}
