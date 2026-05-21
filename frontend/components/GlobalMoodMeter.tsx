"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { GlobalMood } from "@/lib/types";
import { EMOTION_COLORS, EMOTION_GLOW } from "@/lib/types";

interface Props { mood: GlobalMood | null; }

const CX = 160, CY = 160, R = 120, STROKE = 14;

function polarToXY(angle: number, r: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function arc(startAngle: number, endAngle: number, r: number): string {
  const s = polarToXY(startAngle, r);
  const e = polarToXY(endAngle, r);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

// -135° to +135° = 270° arc. Score -1 → -135°, +1 → +135°
function scoreToAngle(score: number) {
  return ((score + 1) / 2) * 270 - 135;
}

const EMOTION_EMOJI: Record<string, string> = {
  EUPHORIC: "✦", EXCITED: "◈", HOPEFUL: "◇", NOSTALGIC: "◉",
  NEUTRAL: "○", ANXIOUS: "◆", MELANCHOLIC: "◐", ANGRY: "◼",
  DEPRESSED: "◯", CHAOTIC: "✸",
};

export default function GlobalMoodMeter({ mood }: Props) {
  const emotion = (mood?.emotion ?? "NEUTRAL") as keyof typeof EMOTION_COLORS;
  const color = EMOTION_COLORS[emotion] ?? "#64748b";
  const glow  = EMOTION_GLOW[emotion]  ?? "rgba(100,116,139,0.3)";
  const score = mood?.score ?? 0;
  const intensity = mood?.intensity ?? 0.5;
  const volatility = mood?.volatility ?? 0.3;
  const energy = mood?.energy_index ?? 50;

  const fillAngle = scoreToAngle(score);
  const trackPath = arc(-135, 135, R);
  const fillPath  = arc(-135, fillAngle, R);

  return (
    <div className="flex flex-col items-center">
      <p className="section-header mb-4">Global Mood</p>

      <div className="relative" style={{ width: 320, height: 280 }}>
        {/* Glow halo */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: `radial-gradient(ellipse 60% 55% at 50% 55%, ${glow}, transparent 70%)`,
          }}
        />

        <svg
          width={320}
          height={280}
          viewBox={`0 0 ${CX * 2} ${CY * 2}`}
          className="relative z-10"
        >
          <defs>
            <filter id="glow-filter">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <linearGradient id="track-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#ff3366" stopOpacity="0.3" />
              <stop offset="50%"  stopColor="#64748b" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#00d4aa" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Track */}
          <path d={trackPath} fill="none" stroke="url(#track-grad)" strokeWidth={STROKE}
            strokeLinecap="round" opacity={0.4} />

          {/* Tick marks */}
          {[-135, -90, -45, 0, 45, 90, 135].map((a) => {
            const outer = polarToXY(a, R + 8);
            const inner = polarToXY(a, R - 8);
            return (
              <line key={a}
                x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y}
                stroke="rgba(255,255,255,0.15)" strokeWidth="1"
              />
            );
          })}

          {/* Fill arc */}
          <motion.path
            d={fillPath}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            filter="url(#glow-filter)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            key={fillPath}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />

          {/* Needle dot */}
          {(() => {
            const { x, y } = polarToXY(fillAngle, R);
            return (
              <motion.circle
                cx={x} cy={y} r={8}
                fill={color}
                filter="url(#glow-filter)"
                animate={{ r: [7, 9, 7] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            );
          })()}

          {/* Center emotion icon */}
          <text
            x={CX} y={CY - 18}
            textAnchor="middle"
            fill={color}
            fontSize="28"
            filter="url(#glow-filter)"
          >
            {EMOTION_EMOJI[emotion] ?? "○"}
          </text>

          {/* Emotion label */}
          <AnimatePresence mode="wait">
            <motion.text
              key={emotion}
              x={CX} y={CY + 16}
              textAnchor="middle"
              fill={color}
              fontSize="13"
              fontFamily="var(--font-orbitron)"
              fontWeight="700"
              letterSpacing="3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {emotion}
            </motion.text>
          </AnimatePresence>

          {/* Score */}
          <text
            x={CX} y={CY + 36}
            textAnchor="middle"
            fill="rgba(255,255,255,0.5)"
            fontSize="10"
            fontFamily="var(--font-jetbrains)"
          >
            {score >= 0 ? "+" : ""}{score.toFixed(3)}
          </text>

          {/* Labels */}
          <text x={22} y={200} textAnchor="middle" fill="#ff3366" fontSize="7" fontFamily="var(--font-orbitron)" letterSpacing="1">NEG</text>
          <text x={298} y={200} textAnchor="middle" fill="#00d4aa" fontSize="7" fontFamily="var(--font-orbitron)" letterSpacing="1">POS</text>
        </svg>
      </div>

      {/* Sub-metrics */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs mt-2">
        {[
          { label: "INTENSITY", value: intensity, color: "#00f0ff" },
          { label: "VOLATILITY", value: volatility, color: "#ffb700" },
          { label: "ENERGY", value: energy / 100, color: "#7b2fff" },
        ].map(({ label, value, color: c }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-display font-bold tracking-widest" style={{ color: c, opacity: 0.7 }}>
              {label}
            </span>
            <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: c }}
                animate={{ width: `${(value * 100).toFixed(1)}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <span className="text-[10px] font-mono" style={{ color: c }}>
              {(value * 100).toFixed(0)}
            </span>
          </div>
        ))}
      </div>

      {/* Active event */}
      {mood?.active_event && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 px-3 py-2 rounded border border-cyber-pink/40 bg-cyber-pink/10 text-center"
        >
          <span className="neon-pink text-[10px] font-display font-bold tracking-wider">
            ⚡ {mood.active_event}
          </span>
        </motion.div>
      )}
    </div>
  );
}
