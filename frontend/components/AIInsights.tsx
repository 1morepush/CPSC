"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AIInsight } from "@/lib/types";

interface Props { insights: AIInsight[]; }

const SEVERITY_STYLES: Record<string, { color: string; label: string; border: string }> = {
  high:     { color: "#ff006e", label: "ALERT",   border: "rgba(255,0,110,0.3)" },
  moderate: { color: "#ffb700", label: "NOTICE",  border: "rgba(255,183,0,0.3)" },
  info:     { color: "#00f0ff", label: "INFO",    border: "rgba(0,240,255,0.2)" },
};

const CATEGORY_ICONS: Record<string, string> = {
  shift:   "⟳",
  spike:   "↑",
  pattern: "◈",
  warning: "⚠",
};

function TypewriterText({ text, onDone }: { text: string; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);

  useEffect(() => {
    setDisplayed("");
    idx.current = 0;
    const interval = setInterval(() => {
      if (idx.current < text.length) {
        setDisplayed(text.slice(0, idx.current + 1));
        idx.current++;
      } else {
        clearInterval(interval);
        onDone?.();
      }
    }, 22);
    return () => clearInterval(interval);
  }, [text, onDone]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && (
        <span className="inline-block w-[6px] h-[12px] bg-cyber-cyan ml-0.5 animate-pulse" />
      )}
    </span>
  );
}

export default function AIInsights({ insights }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (insights.length === 0) return;
    setActiveIndex(0);
  }, [insights.length]);

  const current = insights[activeIndex];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <p className="section-header">AI Insights</p>
        <span className="flex items-center gap-1.5 text-[9px] font-mono text-cyber-purple/70">
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-cyber-purple"
            animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          ANALYZING
        </span>
      </div>

      {/* Current insight */}
      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-lg p-3 border mb-3 relative overflow-hidden"
            style={{
              borderColor: SEVERITY_STYLES[current.severity]?.border ?? "rgba(0,240,255,0.2)",
              background: `${SEVERITY_STYLES[current.severity]?.color ?? "#00f0ff"}08`,
            }}
          >
            {/* Category badge */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[10px] font-display font-bold"
                style={{ color: SEVERITY_STYLES[current.severity]?.color }}
              >
                {CATEGORY_ICONS[current.category] ?? "◉"} {SEVERITY_STYLES[current.severity]?.label}
              </span>
              <span className="text-[8px] font-mono text-white/25 ml-auto">
                {current.category.toUpperCase()}
              </span>
            </div>

            {/* Text */}
            <p
              className="text-[12px] font-mono leading-relaxed"
              style={{ color: SEVERITY_STYLES[current.severity]?.color ?? "#00f0ff", opacity: 0.9 }}
            >
              <TypewriterText text={`> ${current.text}`} />
            </p>

            {/* Decorative corner */}
            <div
              className="absolute top-0 right-0 w-8 h-8 border-r border-t rounded-bl-none opacity-30"
              style={{ borderColor: SEVERITY_STYLES[current.severity]?.color }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Insight history */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {insights.slice(1, 8).map((ins, i) => {
          const s = SEVERITY_STYLES[ins.severity] ?? SEVERITY_STYLES.info;
          return (
            <motion.button
              key={ins.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setActiveIndex(insights.indexOf(ins))}
              className="w-full text-left rounded p-2 border border-white/5 hover:border-white/15 transition-colors"
              style={{ background: `${s.color}06` }}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[9px]" style={{ color: s.color }}>
                  {CATEGORY_ICONS[ins.category]}
                </span>
                <p className="text-[10px] text-white/40 leading-tight line-clamp-1 flex-1">
                  {ins.text}
                </p>
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: s.color, opacity: 0.6 }}
                />
              </div>
            </motion.button>
          );
        })}
      </div>

      {insights.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-white/20 text-xs font-mono">
          Generating insights...
        </div>
      )}
    </div>
  );
}
