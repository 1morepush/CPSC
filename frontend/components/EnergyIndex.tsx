"use client";

import { motion } from "framer-motion";
import type { GlobalMood } from "@/lib/types";

interface Props { mood: GlobalMood | null; }

function energyLabel(v: number): string {
  if (v >= 90) return "CRITICAL";
  if (v >= 75) return "INTENSE";
  if (v >= 55) return "ELEVATED";
  if (v >= 35) return "MODERATE";
  if (v >= 15) return "LOW";
  return "DORMANT";
}

function energyColor(v: number): string {
  if (v >= 90) return "#ff006e";
  if (v >= 75) return "#ff3366";
  if (v >= 55) return "#ffb700";
  if (v >= 35) return "#00f0ff";
  return "#64748b";
}

export default function EnergyIndex({ mood }: Props) {
  const energy = mood?.energy_index ?? 50;
  const color = energyColor(energy);
  const label = energyLabel(energy);

  const bars = 20;
  const filled = Math.round((energy / 100) * bars);

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="section-header">Internet Energy</p>

      {/* Big number */}
      <div className="relative flex flex-col items-center">
        <motion.span
          key={Math.round(energy / 5) * 5}
          className="text-6xl font-display font-black"
          style={{ color, textShadow: `0 0 20px ${color}80, 0 0 50px ${color}30` }}
          initial={{ scale: 0.9, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {energy.toFixed(0)}
        </motion.span>
        <span className="text-[9px] font-display font-bold tracking-[0.3em] mt-1" style={{ color, opacity: 0.7 }}>
          {label}
        </span>
      </div>

      {/* Bar visualization */}
      <div className="flex items-end gap-[2px]" style={{ height: 40 }}>
        {Array.from({ length: bars }).map((_, i) => {
          const active = i < filled;
          const height = active
            ? 16 + Math.sin((i / bars) * Math.PI) * 24
            : 4;
          return (
            <motion.div
              key={i}
              className="w-2 rounded-sm"
              animate={{ height, opacity: active ? 1 : 0.15 }}
              transition={{ duration: 0.4, delay: i * 0.01 }}
              style={{
                backgroundColor: active ? color : "#ffffff22",
                boxShadow: active ? `0 0 6px ${color}80` : "none",
              }}
            />
          );
        })}
      </div>

      {/* Sub stats */}
      <div className="w-full space-y-1.5 text-[10px] font-mono">
        {[
          { label: "SENTIMENT DRIFT", value: ((mood?.drift ?? 0) * 100).toFixed(1), unit: "pts/min", positive: (mood?.drift ?? 0) > 0 },
          { label: "VOLATILITY IDX", value: ((mood?.volatility ?? 0.3) * 100).toFixed(0), unit: "%" },
        ].map(({ label: lbl, value, unit, positive }) => (
          <div key={lbl} className="flex justify-between items-center">
            <span className="text-white/40 tracking-wider">{lbl}</span>
            <span style={{ color: positive === undefined ? "#00f0ff" : positive ? "#00d4aa" : "#ff3366" }}>
              {positive !== undefined && (positive ? "▲" : "▼")} {value}
              <span className="text-white/30 ml-0.5">{unit}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Waveform */}
      <WaveformBar energy={energy} color={color} />
    </div>
  );
}

function WaveformBar({ energy, color }: { energy: number; color: string }) {
  const points = 32;
  return (
    <svg width="100%" height="32" viewBox={`0 0 ${points * 5} 32`}>
      {Array.from({ length: points }).map((_, i) => {
        const amp = (energy / 100) * 14 + 2;
        const h = amp * (0.4 + 0.6 * Math.abs(Math.sin((i / points) * Math.PI * 3 + Date.now() / 1000)));
        return (
          <motion.rect
            key={i}
            x={i * 5}
            y={16 - h / 2}
            width={3}
            height={h}
            rx={1}
            fill={color}
            opacity={0.6 + 0.4 * (i % 3 === 0 ? 1 : 0)}
            animate={{ height: [h * 0.7, h * 1.3, h * 0.7] }}
            transition={{
              duration: 0.8 + (i % 5) * 0.15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.03,
            }}
          />
        );
      })}
    </svg>
  );
}
