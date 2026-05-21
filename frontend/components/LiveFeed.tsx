"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { LivePost } from "@/lib/types";
import { PLATFORM_COLORS } from "@/lib/types";

interface Props { posts: LivePost[]; }

const PLATFORM_ICONS: Record<string, string> = {
  reddit: "⬆",
  twitter: "✦",
  youtube: "▶",
  news: "◉",
  tiktok: "♫",
  discord: "◈",
};

const SENTIMENT_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  positive: { color: "#00d4aa", bg: "rgba(0,212,170,0.12)", label: "POS" },
  negative: { color: "#ff3366", bg: "rgba(255,51,102,0.12)", label: "NEG" },
  neutral:  { color: "#64748b", bg: "rgba(100,116,139,0.12)", label: "NEU" },
};

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s`;
  if (diff < 3600) return `${Math.round(diff / 60)}m`;
  return `${Math.round(diff / 3600)}h`;
}

export default function LiveFeed({ posts }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <p className="section-header">Live Feed</p>
        <span className="flex items-center gap-1.5 text-[9px] font-mono text-cyber-green/70">
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-cyber-green"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          STREAMING
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        <AnimatePresence initial={false}>
          {posts.map((post) => {
            const sent = SENTIMENT_STYLES[post.sentiment] ?? SENTIMENT_STYLES.neutral;
            const platColor = PLATFORM_COLORS[post.platform] ?? "#64748b";
            return (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="rounded-lg p-2.5 border border-white/5 hover:border-white/10 transition-colors"
                style={{ background: sent.bg }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: platColor }}
                    >
                      {PLATFORM_ICONS[post.platform] ?? "○"} {post.community}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[8px] font-display font-bold tracking-widest px-1.5 py-0.5 rounded"
                      style={{ color: sent.color, backgroundColor: `${sent.color}22` }}
                    >
                      {sent.label}
                    </span>
                    <span className="text-[9px] font-mono text-white/25">
                      {timeAgo(post.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <p className="text-[11px] text-white/70 leading-relaxed line-clamp-2">
                  {post.content}
                </p>

                {/* Score bar */}
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-[2px] bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.abs(post.score) * 100}%`,
                        backgroundColor: sent.color,
                        marginLeft: post.score < 0 ? `${(1 - Math.abs(post.score)) * 100}%` : undefined,
                      }}
                    />
                  </div>
                  <span className="text-[9px] font-mono" style={{ color: sent.color }}>
                    {post.score >= 0 ? "+" : ""}{post.score.toFixed(2)}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {posts.length === 0 && (
          <div className="flex items-center justify-center h-24 text-white/20 text-xs font-mono">
            Waiting for signal...
          </div>
        )}
      </div>
    </div>
  );
}
