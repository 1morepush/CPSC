"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  GlobalMood, CommunityMood, LivePost, Trend,
  AIInsight, MoodHistoryPoint, NetworkNode, NetworkEdge, FullSnapshot,
} from "@/lib/types";
import { useWebSocket } from "./useWebSocket";
import { fetchSnapshot } from "@/lib/api";
import { generateDemoSnapshot, generateDemoUpdate } from "@/lib/demoData";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL
  ? `${process.env.NEXT_PUBLIC_WS_URL}/ws/feed`
  : "ws://localhost:8000/ws/feed";

const DEMO_MODE =
  process.env.NEXT_PUBLIC_API_URL === undefined ||
  process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export interface MoodData {
  globalMood: GlobalMood | null;
  communities: CommunityMood[];
  liveFeed: LivePost[];
  trends: Trend[];
  insights: AIInsight[];
  history: MoodHistoryPoint[];
  networkNodes: NetworkNode[];
  networkEdges: NetworkEdge[];
  wsStatus: "connecting" | "connected" | "disconnected" | "error" | "demo";
}

export function useMoodData(): MoodData {
  const [data, setData] = useState<MoodData>({
    globalMood: null,
    communities: [],
    liveFeed: [],
    trends: [],
    insights: [],
    history: [],
    networkNodes: [],
    networkEdges: [],
    wsStatus: "connecting",
  });

  const handleMessage = useCallback((msg: Record<string, unknown>) => {
    if (msg.type !== "live_update") return;
    setData((prev) => ({
      globalMood: (msg.global_mood as GlobalMood) ?? prev.globalMood,
      communities: (msg.communities as CommunityMood[]) ?? prev.communities,
      liveFeed: [
        ...((msg.latest_posts as LivePost[]) ?? []),
        ...prev.liveFeed,
      ].slice(0, 60),
      trends: (msg.trends as Trend[]) ?? prev.trends,
      insights: msg.latest_insight
        ? [msg.latest_insight as AIInsight, ...prev.insights].slice(0, 20)
        : prev.insights,
      history: (msg.history as MoodHistoryPoint[]) ?? prev.history,
      networkNodes: (msg.network_nodes as NetworkNode[]) ?? prev.networkNodes,
      networkEdges: (msg.network_edges as NetworkEdge[]) ?? prev.networkEdges,
      wsStatus: "connected",
    }));
  }, []);

  const { status } = useWebSocket<Record<string, unknown>>(WS_URL, handleMessage);

  // Load initial snapshot from REST
  useEffect(() => {
    if (DEMO_MODE) return;
    fetchSnapshot()
      .then((snap: FullSnapshot) => {
        setData((prev) => ({
          ...prev,
          globalMood: snap.global_mood,
          communities: snap.communities,
          liveFeed: snap.live_feed,
          trends: snap.trends,
          insights: snap.insights,
          history: snap.history,
          networkNodes: snap.network_nodes,
          networkEdges: snap.network_edges,
        }));
      })
      .catch(() => {/* will rely on WS data */});
  }, []);

  // Demo mode: simulate live data with setInterval
  useEffect(() => {
    if (!DEMO_MODE) return;
    const snap = generateDemoSnapshot();
    setData({
      globalMood: snap.global_mood,
      communities: snap.communities,
      liveFeed: snap.live_feed,
      trends: snap.trends,
      insights: snap.insights,
      history: snap.history,
      networkNodes: snap.network_nodes,
      networkEdges: snap.network_edges,
      wsStatus: "demo",
    });

    const interval = setInterval(() => {
      setData((prev) => {
        const update = generateDemoUpdate(prev);
        return update;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return DEMO_MODE ? data : { ...data, wsStatus: status };
}
