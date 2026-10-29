
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Activity } from "lucide-react";
import Panel from "../common/Panel";

const trafficData = [
  { time: "09:00", incoming: 42, outgoing: 24 },
  { time: "09:05", incoming: 56, outgoing: 32 },
  { time: "09:10", incoming: 47, outgoing: 29 },
  { time: "09:15", incoming: 72, outgoing: 43 },
  { time: "09:20", incoming: 61, outgoing: 35 },
  { time: "09:25", incoming: 88, outgoing: 51 },
  { time: "09:30", incoming: 69, outgoing: 39 },
  { time: "09:35", incoming: 96, outgoing: 58 },
  { time: "09:40", incoming: 76, outgoing: 45 },
  { time: "09:45", incoming: 108, outgoing: 62 },
  { time: "09:50", incoming: 83, outgoing: 48 },
  { time: "09:55", incoming: 117, outgoing: 67 },
];

const tooltipStyle = {
  background: "#0d1728",
  border: "1px solid rgba(92,225,230,.2)",
  borderRadius: 10,
  color: "#e5eefb",
  fontSize: 11,
};

export default function TrafficChart() {
  return (
    <Panel
      title="Network traffic"
      eyebrow="TRAFFIC ANALYTICS"
      className="traffic-panel"
      action={
        <span className="chart-live-label">
          <Activity size={13} /> Sample visualization
        </span>
      }
    >
      <div className="chart-legend">
        <span><i className="legend-dot legend-dot--cyan" /> Incoming</span>
        <span><i className="legend-dot legend-dot--violet" /> Outgoing</span>
      </div>

      <div className="traffic-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trafficData} margin={{ top: 12, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="incomingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5ce1e6" stopOpacity={0.27} />
                <stop offset="95%" stopColor="#5ce1e6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="outgoingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9b8cff" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#9b8cff" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="rgba(143,163,195,.09)"
              strokeDasharray="3 5"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#71829b", fontSize: 10 }}
              minTickGap={22}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#71829b", fontSize: 10 }}
              width={38}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ stroke: "rgba(92,225,230,.3)", strokeDasharray: "4 4" }}
            />
            <Area
              type="monotone"
              dataKey="incoming"
              name="Incoming"
              stroke="#5ce1e6"
              strokeWidth={2}
              fill="url(#incomingGradient)"
              activeDot={{ r: 4, fill: "#5ce1e6", stroke: "#0d1728", strokeWidth: 2 }}
              isAnimationActive
            />
            <Area
              type="monotone"
              dataKey="outgoing"
              name="Outgoing"
              stroke="#9b8cff"
              strokeWidth={2}
              fill="url(#outgoingGradient)"
              activeDot={{ r: 4, fill: "#9b8cff", stroke: "#0d1728", strokeWidth: 2 }}
              isAnimationActive
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="chart-disclaimer">
        Illustrative traffic values · Replace with telemetry when available
      </p>
    </Panel>
  );
}
