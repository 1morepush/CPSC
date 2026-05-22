"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Trend } from "@/lib/types";

interface Props { trends: Trend[]; }

const PLATFORM_COLORS: Record<string, string> = {
  reddit: "#ff4500", twitter: "#1da1f2", youtube: "#ff0000",
  news: "#00f0ff", tiktok: "#ff0050",
};

const CATEGORY_COLORS: Record<string, string> = {
  technology: "#7b2fff", gaming: "#00d4aa", finance: "#ffb700",
  culture: "#ff006e", world: "#ff3366", music: "#ff6b35",
};

const SENTIMENT_DOT: Record<string, string> = {
  positive: "#00d4aa", negative: "#ff3366", neutral: "#64748b",
};

export default function TrendPanel({ trends }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <p className="section-header">Viral Trends</p>
        <span className="text-[9px] font-mono text-white/30">hype &amp; velocity</span>
      </div>

      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        <AnimatePresence>
          {trends.map((t, i) => {
            const platColor = PLATFORM_COLORS[t.platform] ?? "#64748b";
            const catColor = CATEGORY_COLORS[t.category] ?? "#64748b";
            const sentColor = SENTIMENT_DOT[t.sentiment] ?? "#64748b";

            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-lg p-2.5 border border-white/5 hover:border-white/10 transition-colors"
                style={{ background: `${catColor}08` }}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-bold" style={{ color: platColor }}>
                        {t.platform.toUpperCase()}
                      </span>
                      <span className="text-[8px] px-1 rounded" style={{ color: catColor, background: `${catColor}22` }}>
                        {t.category}
                      </span>
                      <span
                        className="w-1.5 h-1.5 rounded-full inline-block"
                        style={{ backgroundColor: sentColor, boxShadow: `0 0 4px ${sentColor}` }}
                      />
                    </div>
                    <p className="text-[12px] font-mono text-white/80 leading-tight">{t.title}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className="text-lg font-display font-black"
                      style={{ color: t.hype_score > 70 ? "#ff006e" : "#00f0ff", lineHeight: 1 }}
                    >
                      {t.hype_score.toFixed(0)}
                    </div>
                    <div className="text-[7px] font-display tracking-widest text-white/30">HYPE</div>
                  </div>
                </div>

                {/* Hype bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      animate={{ width: `${t.hype_score}%` }}
                      transition={{ duration: 0.6 }}
                      style={{
                        background: t.hype_score > 70
                          ? "linear-gradient(90deg, #ff006e, #ff3366)"
                          : "linear-gradient(90deg, #00f0ff, #7b2fff)",
                        boxShadow: t.hype_score > 70 ? "0 0 8px #ff006e80" : "0 0 8px #00f0ff60",
                      }}
                    />
                  </div>
                  <div className="text-[9px] font-mono text-white/40 shrink-0">
                    <span className="text-cyber-amber">↑{t.viral_velocity.toFixed(1)}x</span>
                    {" "}
                    <span>{(t.volume / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {trends.length === 0 && (
          <div className="flex items-center justify-center h-20 text-white/20 text-xs font-mono">
            Scanning trends...
          </div>
        )}
      </div>
    </div>
  );
}
