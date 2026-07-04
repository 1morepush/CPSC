"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMoodData, CLIENT_DEMO } from "@/hooks/useMoodData";
import { useMode } from "@/hooks/useMode";
import GlobalMoodMeter from "@/components/GlobalMoodMeter";
import EnergyIndex from "@/components/EnergyIndex";
import LiveFeed from "@/components/LiveFeed";
import CommunityMoods from "@/components/CommunityMoods";
import TrendPanel from "@/components/TrendPanel";
import AIInsights from "@/components/AIInsights";
import EmotionTimeline from "@/components/EmotionTimeline";

const ParticleField = dynamic(() => import("@/components/ParticleField"), { ssr: false });
const PropagationNetwork = dynamic(() => import("@/components/PropagationNetwork"), { ssr: false });

const STATUS_COLORS = {
  connected: "#00d4aa",
  demo:      "#7b2fff",
  connecting: "#ffb700",
  disconnected: "#ff3366",
  error:     "#ff006e",
};

function LiveClock() {
  const [time, setTime] = useState("--:--:--");
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono text-[11px] text-white/40">{time}</span>;
}

export default function Dashboard() {
  const data = useMoodData();
  const { isDemo, toggle, loading } = useMode();
  const statusColor = STATUS_COLORS[data.wsStatus] ?? "#64748b";

  return (
    <div className="relative min-h-screen bg-void bg-grid overflow-hidden">
      <ParticleField />

      {/* Top gradient overlay */}
      <div
        className="fixed top-0 left-0 right-0 h-px z-50"
        style={{ background: "linear-gradient(90deg, transparent, #00f0ff, transparent)" }}
      />

      <main className="relative z-10 p-4 lg:p-6 space-y-4 max-w-[1920px] mx-auto">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <motion.div
                className="w-8 h-8 rounded-full border-2 border-cyber-cyan"
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-cyber-cyan animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="font-display font-black text-xl lg:text-2xl neon-cyan tracking-wider glitch">
                INTERNET MOOD TRACKER
              </h1>
              <p className="text-[10px] font-mono text-white/30 tracking-widest">
                REAL-TIME EMOTIONAL INTELLIGENCE PLATFORM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LiveClock />

            {/* Demo / Live toggle (hidden in standalone demo mode — no backend) */}
            {!CLIENT_DEMO && (
              <motion.button
                onClick={toggle}
                disabled={loading}
                whileTap={{ scale: 0.95 }}
                className="relative flex items-center gap-2 px-3 py-1.5 rounded border glass cursor-pointer select-none"
                style={{
                  borderColor: isDemo ? "#7b2fff55" : "#00d4aa55",
                  opacity: loading ? 0.6 : 1,
                }}
                title={isDemo ? "Switch to Live data" : "Switch to Demo mode"}
              >
                {/* Track */}
                <div
                  className="relative w-8 h-4 rounded-full transition-colors duration-300"
                  style={{ backgroundColor: isDemo ? "#7b2fff44" : "#00d4aa44", border: `1px solid ${isDemo ? "#7b2fff" : "#00d4aa"}` }}
                >
                  <motion.div
                    className="absolute top-0.5 w-3 h-3 rounded-full"
                    animate={{ left: isDemo ? "2px" : "17px" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    style={{ backgroundColor: isDemo ? "#7b2fff" : "#00d4aa", boxShadow: `0 0 6px ${isDemo ? "#7b2fff" : "#00d4aa"}` }}
                  />
                </div>
                <span
                  className="text-[10px] font-display font-bold tracking-widest"
                  style={{ color: isDemo ? "#7b2fff" : "#00d4aa" }}
                >
                  {loading ? "···" : isDemo ? "DEMO" : "LIVE"}
                </span>
              </motion.button>
            )}

            {/* WS status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-white/10 glass">
              <motion.div
                className="w-2 h-2 rounded-full"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{ backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}` }}
              />
              <span className="text-[10px] font-display font-bold tracking-widest" style={{ color: statusColor }}>
                {data.wsStatus === "demo" ? "DEMO" : data.wsStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* ── Row 1: Mood Meter + Energy + Event banner ─────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Mood meter */}
          <div className="glass border border-white/5 rounded-xl p-5 flex justify-center border-glow-cyan">
            <GlobalMoodMeter mood={data.globalMood} />
          </div>

          {/* Energy index */}
          <div className="glass border border-white/5 rounded-xl p-5 border-glow-purple">
            <EnergyIndex mood={data.globalMood} />
          </div>

          {/* Stats + Active Event */}
          <div className="glass border border-white/5 rounded-xl p-5 space-y-3">
            <p className="section-header">System Status</p>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Communities", value: data.communities.length, color: "#00f0ff" },
                { label: "Trends",      value: data.trends.length,      color: "#7b2fff" },
                { label: "Posts/min",   value: "~42",                   color: "#ffb700" },
                { label: "Sources",     value: "5",                     color: "#00d4aa" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-lg p-2 border border-white/5 text-center">
                  <div
                    className="text-2xl font-display font-black"
                    style={{ color, textShadow: `0 0 12px ${color}60` }}
                  >
                    {value}
                  </div>
                  <div className="text-[8px] font-display tracking-widest text-white/30 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Platforms */}
            <div>
              <p className="section-header mb-2">Data Sources</p>
              <div className="flex flex-wrap gap-1.5">
                {["Hacker News","Mastodon","Reddit","NewsAPI","Simulation"].map(p => (
                  <span
                    key={p}
                    className="text-[8px] font-display font-bold tracking-wider px-2 py-1 rounded border border-cyber-cyan/20 text-cyber-cyan/60"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {data.globalMood?.active_event && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-2.5 rounded border border-cyber-pink/30 bg-cyber-pink/10"
              >
                <p className="text-[9px] font-display font-bold tracking-widest text-cyber-pink mb-1">
                  ⚡ ACTIVE EVENT
                </p>
                <p className="text-[11px] font-mono text-white/70">{data.globalMood.active_event}</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Row 2: Network + Community Moods ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 glass border border-white/5 rounded-xl p-5 min-h-[400px] border-glow-cyan">
            <PropagationNetwork nodes={data.networkNodes} edges={data.networkEdges} />
          </div>
          <div className="glass border border-white/5 rounded-xl p-5 min-h-[400px] overflow-hidden">
            <CommunityMoods communities={data.communities} />
          </div>
        </div>

        {/* ── Row 3: Timeline ───────────────────────────────────────────── */}
        <div className="glass border border-white/5 rounded-xl p-5 h-52 border-glow-purple">
          <EmotionTimeline history={data.history} />
        </div>

        {/* ── Row 4: Live Feed + AI Insights + Trends ───────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="glass border border-white/5 rounded-xl p-5 min-h-[360px] overflow-hidden">
            <LiveFeed posts={data.liveFeed} />
          </div>
          <div className="glass border border-white/5 rounded-xl p-5 min-h-[360px] border-glow-purple overflow-hidden">
            <AIInsights insights={data.insights} />
          </div>
          <div className="glass border border-white/5 rounded-xl p-5 min-h-[360px] overflow-hidden">
            <TrendPanel trends={data.trends} />
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer className="text-center py-3">
          <div className="gradient-line w-full mb-3" />
          <p className="text-[9px] font-mono text-white/15 tracking-widest">
            INTERNET MOOD TRACKER · AI-POWERED SENTIMENT INTELLIGENCE · DATA REFRESHES EVERY 2s
          </p>
        </footer>
      </main>
    </div>
  );
}
