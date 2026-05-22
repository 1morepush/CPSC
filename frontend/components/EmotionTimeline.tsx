"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { MoodHistoryPoint } from "@/lib/types";
import { EMOTION_COLORS } from "@/lib/types";

interface Props { history: MoodHistoryPoint[]; }

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

// Custom tooltip
function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: MoodHistoryPoint }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const color = EMOTION_COLORS[d.emotion] ?? "#64748b";
  return (
    <div className="glass rounded-lg p-2 border border-white/10 text-[10px] font-mono">
      <div className="text-white/50">{formatTime(d.timestamp)}</div>
      <div style={{ color }} className="font-bold">{d.emotion}</div>
      <div className="text-white/70">score: {d.score >= 0 ? "+" : ""}{d.score.toFixed(3)}</div>
      <div className="text-white/50">intensity: {(d.intensity * 100).toFixed(0)}%</div>
      {d.event && <div className="text-cyber-pink mt-1">⚡ {d.event}</div>}
    </div>
  );
}

export default function EmotionTimeline({ history }: Props) {
  if (history.length < 2) {
    return (
      <div className="flex flex-col h-full">
        <p className="section-header mb-3">Emotion Timeline</p>
        <div className="flex-1 flex items-center justify-center text-white/20 text-xs font-mono">
          Building timeline...
        </div>
      </div>
    );
  }

  const data = history.slice(-60);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <p className="section-header">Emotion Timeline</p>
        <div className="flex items-center gap-3 text-[9px] font-mono text-white/30">
          <span>last 5h</span>
          <span className="flex items-center gap-1">
            <span className="w-6 h-[2px] bg-cyber-cyan inline-block rounded" />mood
          </span>
          <span className="flex items-center gap-1">
            <span className="w-6 h-[2px] bg-cyber-purple inline-block rounded" />intensity
          </span>
        </div>
      </div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="grad-score" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#00f0ff" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad-neg-score" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#ff3366" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ff3366" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad-intensity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#7b2fff" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#7b2fff" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />

            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />

            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTime}
              tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 8, fontFamily: "var(--font-jetbrains)" }}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.05)" }}
              interval={Math.max(1, Math.floor(data.length / 6))}
            />
            <YAxis
              domain={[-1, 1]}
              tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 8, fontFamily: "var(--font-jetbrains)" }}
              tickLine={false}
              axisLine={false}
              ticks={[-1, -0.5, 0, 0.5, 1]}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="intensity"
              stroke="#7b2fff"
              strokeWidth={1}
              fill="url(#grad-intensity)"
              dot={false}
              activeDot={{ r: 3, fill: "#7b2fff", stroke: "none" }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#00f0ff"
              strokeWidth={1.5}
              fill="url(#grad-score)"
              dot={false}
              activeDot={{ r: 4, fill: "#00f0ff", stroke: "#050508", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
