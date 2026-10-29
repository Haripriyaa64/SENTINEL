
import { Radio, Thermometer, Activity, Wifi } from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import Panel from "../components/common/Panel";
import StatusBadge from "../components/common/StatusBadge";

export default function Sensors({ apiOnline = false }) {
  const sensorTypes = [
    { name: "Temperature", icon: Thermometer, description: "Thermal telemetry" },
    { name: "Vibration", icon: Activity, description: "Mechanical vibration" },
    { name: "Network sensor", icon: Wifi, description: "Network event telemetry" },
  ];

  return (
    <div className="page-content">
      <PageHeader
        eyebrow="DEVICE & TELEMETRY MONITORING"
        title="Sensor"
        accent="Health"
        description="Monitor connected data sources and inspect telemetry integration status."
      />

      <div className="sensor-connection-banner">
        <div className="sensor-connection-icon"><Radio size={20} /></div>
        <div>
          <strong>Backend connectivity</strong>
          <p>
            {apiOnline
              ? "The API health check succeeded. Sensor-specific readings still require a confirmed telemetry endpoint."
              : "The backend is not reachable. Start the API service to check connectivity."}
          </p>
        </div>
        <StatusBadge status={apiOnline ? "online" : "offline"} />
      </div>

      <div className="sensor-card-grid">
        {sensorTypes.map(({ name, icon: Icon, description }) => (
          <Panel key={name} title={name} eyebrow="DATA SOURCE">
            <div className="sensor-placeholder-icon"><Icon size={22} /></div>
            <p className="sensor-description">{description}</p>
            <div className="sensor-card-footer">
              <span>Telemetry status</span>
              <StatusBadge status="unknown" />
            </div>
          </Panel>
        ))}
      </div>

      <Panel title="Integration required" eyebrow="NEXT STEP">
        <p className="sensor-integration-note">
          Connect this page to the actual sensor or telemetry API before displaying
          device health, temperatures, vibration readings, or last-seen timestamps.
          No sensor readings are currently fabricated or assumed.
        </p>
      </Panel>
    </div>
  );
}
