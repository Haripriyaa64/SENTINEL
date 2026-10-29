
import { motion } from "framer-motion";
import { Radar, Crosshair } from "lucide-react";
import Panel from "../common/Panel";

const targets = [
  { x: "67%", y: "26%", delay: 0.3, type: "target--red" },
  { x: "32%", y: "62%", delay: 1.1, type: "target--violet" },
  { x: "76%", y: "70%", delay: 1.8, type: "target--cyan" },
  { x: "45%", y: "35%", delay: 2.4, type: "target--orange" },
];

export default function RadarPanel({ alertCount = 0 }) {
  return (
    <Panel
      title="Threat radar"
      eyebrow="ACTIVITY MONITOR"
      className="radar-panel"
      action={<Radar size={16} color="#5ce1e6" />}
    >
      <div className="radar-layout">
        <div className="radar-visual" role="img" aria-label="Decorative animated threat radar">
          <div className="radar-ring radar-ring--one" />
          <div className="radar-ring radar-ring--two" />
          <div className="radar-ring radar-ring--three" />
          <div className="radar-crosshair radar-crosshair--horizontal" />
          <div className="radar-crosshair radar-crosshair--vertical" />

          <motion.div
            className="radar-sweep"
            animate={{ rotate: 360 }}
            transition={{ duration: 6, ease: "linear", repeat: Infinity }}
          />

          <div className="radar-center-point">
            <Crosshair size={14} />
          </div>

          {targets.map((target, index) => (
            <motion.span
              key={index}
              className={`radar-target ${target.type}`}
              style={{ left: target.x, top: target.y }}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: [0.45, 1, 0.55], scale: [0.8, 1.2, 0.8] }}
              transition={{
                delay: target.delay,
                duration: 2.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <div className="radar-summary">
          <div>
            <span className="radar-summary__label">Tracked alerts</span>
            <strong>{alertCount}</strong>
          </div>
          <div>
            <span className="radar-summary__label">Radar status</span>
            <span className="radar-operational"><i /> VISUAL ACTIVE</span>
          </div>
        </div>
      </div>

      <p className="chart-disclaimer">
        Simulated radar visualization · Not geolocation data
      </p>
    </Panel>
  );
}
