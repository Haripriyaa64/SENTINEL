
import { Globe2, ShieldCheck, Search } from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import Panel from "../components/common/Panel";

export default function ThreatIntelligence({ alerts = [] }) {
  const indicators = alerts.filter((alert) =>
    alert.source_ip || alert.src_ip || alert.destination_ip || alert.dest_ip
  );

  const uniqueIndicators = [
    ...new Set(
      indicators.flatMap((alert) => [
        alert.source_ip ?? alert.src_ip,
        alert.destination_ip ?? alert.dest_ip,
      ]).filter(Boolean)
    ),
  ];

  return (
    <div className="page-content">
      <PageHeader
        eyebrow="THREAT RESEARCH"
        title="Threat"
        accent="Intelligence"
        description="Review network indicators extracted from the available security events."
      />

      <div className="stats-grid stats-grid--three">
        <div className="glass-panel intelligence-stat">
          <Globe2 size={20} />
          <span>Unique IP indicators</span>
          <strong>{uniqueIndicators.length}</strong>
        </div>
        <div className="glass-panel intelligence-stat">
          <ShieldCheck size={20} />
          <span>Alert records analyzed</span>
          <strong>{alerts.length}</strong>
        </div>
        <div className="glass-panel intelligence-stat">
          <Search size={20} />
          <span>External reputation checks</span>
          <strong>Not connected</strong>
        </div>
      </div>

      <Panel title="Extracted network indicators" eyebrow="OBSERVED INDICATORS">
        {uniqueIndicators.length ? (
          <div className="indicator-list">
            {uniqueIndicators.map((ip) => (
              <div className="indicator-row" key={ip}>
                <div>
                  <strong>{ip}</strong>
                  <span>Extracted from backend alert data</span>
                </div>
                <span className="indicator-unverified">Unverified</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="page-empty-state">
            <Globe2 size={26} />
            <strong>No network indicators available</strong>
            <p>
              Source and destination IP fields have not been found in the loaded
              alert records.
            </p>
          </div>
        )}
      </Panel>

      <Panel title="Reputation enrichment" eyebrow="EXTERNAL INTELLIGENCE">
        <p className="sensor-integration-note">
          IP reputation, geolocation, malware intelligence, and threat-feed lookups
          require a configured intelligence provider. An observed IP address alone
          does not establish that it is malicious.
        </p>
      </Panel>
    </div>
  );
}
