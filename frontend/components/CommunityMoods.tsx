"use client";

import { motion } from "framer-motion";
import type { CommunityMood } from "@/lib/types";
import { EMOTION_COLORS, PLATFORM_COLORS } from "@/lib/types";

interface Props { communities: CommunityMood[]; }

const TREND_ICONS = { rising: "▲", falling: "▼", stable: "─" };
const TREND_COLORS = { rising: "#00d4aa", falling: "#ff3366", stable: "#64748b" };

const PLATFORM_ICONS: Record<string, string> = {
  reddit: "⬆", twitter: "✦", youtube: "▶", news: "◉",
};

export default function CommunityMoods({ communities }: Props) {
  return (
    <div className="flex flex-col h-full">
      <p className="section-header mb-3">Community Moods</p>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {communities.map((c, i) => {
          const color = EMOTION_COLORS[c.emotion] ?? "#64748b";
          const platColor = PLATFORM_COLORS[c.platform] ?? "#64748b";
          const trendIcon = TREND_ICONS[c.trend];
          const trendColor = TREND_COLORS[c.trend];
          const pct = ((c.score + 1) / 2 * 100).toFixed(0);

          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-lg p-2.5 border border-white/5 hover:border-white/10 transition-colors"
              style={{ background: `${color}08` }}
            >
              <div className="flex items-center justify-between mb-1.5">
                {/* Name */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px]" style={{ color: platColor }}>
                    {PLATFORM_ICONS[c.platform] ?? "○"}
                  </span>
                  <span className="text-[11px] font-mono text-white/80 truncate">
                    {c.name}
                  </span>
                </div>

                {/* Trend + emotion */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-[8px] font-display font-bold tracking-widest"
                    style={{ color: trendColor }}
                  >
                    {trendIcon}
                  </span>
                  <span
                    className="text-[8px] font-display font-bold tracking-wider px-1.5 py-0.5 rounded"
                    style={{ color, backgroundColor: `${color}22` }}
                  >
                    {c.emotion}
                  </span>
                </div>
              </div>

              {/* Score bar */}
              <div className="relative h-[3px] bg-white/10 rounded-full overflow-hidden">
                {/* Center line */}
                <div className="absolute top-0 left-1/2 w-[1px] h-full bg-white/20 z-10" />
                <motion.div
                  className="absolute top-0 h-full rounded-full"
                  animate={{
                    left: c.score < 0 ? `${50 + c.score * 50}%` : "50%",
                    width: `${Math.abs(c.score) * 50}%`,
                  }}
                  transition={{ duration: 0.5 }}
                  style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}80` }}
                />
              </div>

              {/* Stats */}
              <div className="flex justify-between mt-1.5 text-[9px] font-mono text-white/30">
                <span>{c.post_count.toLocaleString()} posts</span>
                <span style={{ color }}>{c.score >= 0 ? "+" : ""}{c.score.toFixed(2)}</span>
              </div>
            </motion.div>
          );
        })}

        {communities.length === 0 && (
          <div className="flex items-center justify-center h-24 text-white/20 text-xs font-mono">
            Loading communities...
          </div>
        )}
      </div>
    </div>
  );
}
