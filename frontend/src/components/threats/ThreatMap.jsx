
import { motion } from "framer-motion";
import { Globe2, MapPin } from "lucide-react";
import Panel from "../common/Panel";

const nodes = [
  { x: 19, y: 37, label: "Node A", color: "#ff617e" },
  { x: 29, y: 54, label: "Node B", color: "#5ce1e6" },
  { x: 48, y: 35, label: "Node C", color: "#9b8cff" },
  { x: 56, y: 60, label: "Node D", color: "#ffad70" },
  { x: 75, y: 40, label: "Node E", color: "#ff617e" },
  { x: 83, y: 61, label: "Node F", color: "#5ce1e6" },
];

const links = [
  [19, 37, 29, 54],
  [29, 54, 48, 35],
  [48, 35, 56, 60],
  [56, 60, 75, 40],
  [75, 40, 83, 61],
  [19, 37, 75, 40],
];

export default function ThreatMap({ alertCount = 0 }) {
  return (
    <Panel
      title="Global threat activity"
      eyebrow="NETWORK OVERVIEW"
      className="threat-map-panel"
      action={<span className="map-mode-label"><Globe2 size={13} /> GLOBAL VIEW</span>}
    >
      <div className="threat-map">
        <svg
          className="threat-map__svg"
          viewBox="0 0 100 65"
          preserveAspectRatio="none"
          role="img"
          aria-label="Illustrative global network connections"
        >
          <defs>
            <pattern id="mapGrid" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#7b91b5" strokeOpacity=".1" strokeWidth=".15" />
            </pattern>
          </defs>

          <rect width="100" height="65" fill="url(#mapGrid)" />

          <g fill="#26364f" fillOpacity=".85" stroke="#526986" strokeOpacity=".45" strokeWidth=".25">
            <path d="M8 14 L15 8 24 9 29 15 26 20 31 24 27 32 22 34 19 44 14 40 12 31 7 27 5 20Z" />
            <path d="M23 36 L30 38 33 46 29 54 26 62 22 54 20 45Z" />
            <path d="M42 14 L48 11 54 14 57 20 53 24 50 22 47 27 43 22Z" />
            <path d="M47 27 L54 26 59 32 57 41 52 49 48 43 45 34Z" />
            <path d="M55 15 L65 10 77 12 86 18 91 26 86 32 78 29 72 35 65 30 59 24Z" />
            <path d="M77 40 L85 38 91 43 88 51 82 55 77 49Z" />
          </g>

          {links.map(([x1, y1, x2, y2], index) => (
            <motion.line
              key={index}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#5ce1e6"
              strokeOpacity=".48"
              strokeWidth=".25"
              strokeDasharray="1.5 1.5"
              animate={{ strokeOpacity: [0.15, 0.75, 0.15] }}
              transition={{ duration: 2.8, delay: index * 0.25, repeat: Infinity }}
            />
          ))}

          {nodes.map((node, index) => (
            <g key={node.label}>
              <motion.circle
                cx={node.x}
                cy={node.y}
                r="2"
                fill={node.color}
                fillOpacity=".2"
                animate={{ r: [1.5, 3.2, 1.5], fillOpacity: [.1, .3, .1] }}
                transition={{ duration: 2, delay: index * .3, repeat: Infinity }}
              />
              <circle cx={node.x} cy={node.y} r=".7" fill={node.color} />
            </g>
          ))}
        </svg>

        <div className="threat-map__overlay">
          <div className="map-counter">
            <span>ALERTS IN VIEW</span>
            <strong>{alertCount}</strong>
          </div>
          <div className="map-coordinate"><MapPin size={12} /> Illustrative nodes</div>
        </div>
      </div>

      <div className="map-legend">
        <span><i className="legend-dot legend-dot--red" /> High risk</span>
        <span><i className="legend-dot legend-dot--cyan" /> Network node</span>
        <span><i className="legend-dot legend-dot--violet" /> Monitored link</span>
      </div>

      <p className="chart-disclaimer">
        Illustrative map · Markers do not represent real attacker locations
      </p>
    </Panel>
  );
}
