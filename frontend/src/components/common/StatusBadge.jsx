import { motion } from "framer-motion";

const STATUS_CONFIG = {
  online: { label: "Online", color: "green" },
  connected: { label: "Connected", color: "green" },
  healthy: { label: "Healthy", color: "green" },
  active: { label: "Active", color: "green" },
  warning: { label: "Warning", color: "yellow" },
  degraded: { label: "Degraded", color: "yellow" },
  pending: { label: "Pending", color: "yellow" },
  offline: { label: "Offline", color: "red" },
  critical: { label: "Critical", color: "red" },
  error: { label: "Error", color: "red" },
  unknown: { label: "Unknown", color: "muted" },
};

export default function StatusBadge({ status = "unknown", pulse = false }) {
  const key = String(status).toLowerCase();
  const config = STATUS_CONFIG[key] ?? {
    label: String(status),
    color: "muted",
  };

  return (
    <span className={`status-badge status-${config.color}`}>
      <motion.span
        className="status-badge__dot"
        animate={
          pulse
            ? { opacity: [1, 0.45, 1], scale: [1, 1.2, 1] }
            : undefined
        }
        transition={
          pulse
            ? { duration: 1.6, repeat: Infinity }
            : undefined
        }
      />
      {config.label}
    </span>
  );
}