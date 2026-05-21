"use client";

import { useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import type { NetworkNode, NetworkEdge } from "@/lib/types";
import { EMOTION_COLORS } from "@/lib/types";

interface Props {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

// Fixed layout positions for each community node (normalized 0-1)
const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  worldnews:     { x: 0.15, y: 0.22 },
  politics:      { x: 0.30, y: 0.10 },
  newsheadlines: { x: 0.08, y: 0.45 },
  gaming:        { x: 0.70, y: 0.18 },
  gamedtube:     { x: 0.85, y: 0.38 },
  memes:         { x: 0.55, y: 0.30 },
  aww:           { x: 0.50, y: 0.55 },
  musictwitter:  { x: 0.70, y: 0.68 },
  techtwitter:   { x: 0.45, y: 0.82 },
  technology:    { x: 0.28, y: 0.70 },
  science:       { x: 0.15, y: 0.85 },
  wsb:           { x: 0.65, y: 0.50 },
  fintwit:       { x: 0.82, y: 0.78 },
};

export default function PropagationNetwork({ nodes, edges }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const W = 560, H = 360;

  const nodeMap = useMemo(() => {
    const m: Record<string, NetworkNode> = {};
    nodes.forEach(n => { m[n.id] = n; });
    return m;
  }, [nodes]);

  const posOf = (id: string) => {
    const pos = NODE_POSITIONS[id] ?? { x: 0.5, y: 0.5 };
    return { x: pos.x * W, y: pos.y * H };
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <p className="section-header">Emotional Propagation Network</p>
        <span className="text-[9px] font-mono text-white/25">sentiment flow</span>
      </div>

      <div ref={containerRef} className="flex-1 relative rounded-lg overflow-hidden border border-white/5"
        style={{ background: "rgba(0,0,0,0.4)" }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0"
        >
          <defs>
            <filter id="node-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {/* Animated dash marker */}
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M 0 0 L 6 3 L 0 6 z" fill="rgba(255,255,255,0.2)" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map((edge, i) => {
            const s = posOf(edge.source);
            const t = posOf(edge.target);
            const flow = edge.sentiment_flow;
            const color = flow > 0.1 ? "#00d4aa" : flow < -0.1 ? "#ff3366" : "#64748b";
            const opacity = 0.2 + edge.strength * 0.4;
            return (
              <g key={`${edge.source}-${edge.target}`}>
                <line
                  x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                  stroke={color}
                  strokeWidth={1 + edge.strength * 1.5}
                  opacity={opacity}
                />
                {/* Animated flow dot */}
                <motion.circle
                  r={2}
                  fill={color}
                  opacity={0.8}
                  animate={{
                    cx: [s.x, t.x, s.x],
                    cy: [s.y, t.y, s.y],
                  }}
                  transition={{
                    duration: 3 + (i % 4),
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 0.3,
                  }}
                />
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const { x, y } = posOf(node.id);
            const color = EMOTION_COLORS[node.emotion] ?? "#64748b";
            const r = 8 + node.size * 10;

            return (
              <g key={node.id}>
                {/* Glow ring */}
                <motion.circle
                  cx={x} cy={y}
                  r={r + 4}
                  fill="none"
                  stroke={color}
                  strokeWidth={1}
                  opacity={0}
                  animate={{ r: [r + 4, r + 14], opacity: [0.5, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: Math.random() * 2 }}
                />

                {/* Node body */}
                <motion.circle
                  cx={x} cy={y} r={r}
                  fill={`${color}25`}
                  stroke={color}
                  strokeWidth={1.5}
                  filter="url(#node-glow)"
                  animate={{ r: [r * 0.97, r * 1.03, r * 0.97] }}
                  transition={{ duration: 2.5 + Math.random(), repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Label */}
                <text
                  x={x} y={y + r + 11}
                  textAnchor="middle"
                  fill={color}
                  fontSize="7"
                  fontFamily="var(--font-jetbrains)"
                  opacity={0.8}
                >
                  {node.name.replace("r/", "").replace(" YouTube", "").slice(0, 10)}
                </text>

                {/* Score */}
                <text
                  x={x} y={y + 3}
                  textAnchor="middle"
                  fill="white"
                  fontSize="6"
                  fontFamily="var(--font-jetbrains)"
                  opacity={0.7}
                >
                  {node.score >= 0 ? "+" : ""}{node.score.toFixed(2)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-2 right-3 flex gap-3 text-[8px] font-mono text-white/30">
          <span className="flex items-center gap-1">
            <span className="w-3 h-[1px] bg-cyber-green inline-block" />flow+
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-[1px] bg-cyber-red inline-block" />flow−
          </span>
        </div>
      </div>
    </div>
  );
}
