export type Emotion =
  | "EUPHORIC"
  | "EXCITED"
  | "HOPEFUL"
  | "NOSTALGIC"
  | "NEUTRAL"
  | "ANXIOUS"
  | "MELANCHOLIC"
  | "ANGRY"
  | "DEPRESSED"
  | "CHAOTIC";

export type SentimentLabel = "positive" | "negative" | "neutral";
export type TrendDirection = "rising" | "falling" | "stable";
export type InsightCategory = "shift" | "spike" | "pattern" | "warning";
export type InsightSeverity = "info" | "moderate" | "high";

export interface GlobalMood {
  emotion: Emotion;
  score: number;
  intensity: number;
  volatility: number;
  drift: number;
  energy_index: number;
  timestamp: string;
  active_event?: string;
}

export interface CommunityMood {
  id: string;
  name: string;
  platform: string;
  emotion: Emotion;
  score: number;
  trend: TrendDirection;
  post_count: number;
  intensity: number;
}

export interface LivePost {
  id: string;
  platform: string;
  community: string;
  content: string;
  sentiment: SentimentLabel;
  score: number;
  timestamp: string;
}

export interface Trend {
  id: string;
  title: string;
  platform: string;
  hype_score: number;
  viral_velocity: number;
  sentiment: SentimentLabel;
  volume: number;
  category: string;
}

export interface AIInsight {
  id: string;
  text: string;
  category: InsightCategory;
  severity: InsightSeverity;
  timestamp: string;
}

export interface MoodHistoryPoint {
  timestamp: string;
  score: number;
  intensity: number;
  emotion: Emotion;
  event?: string;
}

export interface NetworkNode {
  id: string;
  name: string;
  platform: string;
  score: number;
  emotion: Emotion;
  size: number;
  x?: number;
  y?: number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  strength: number;
  sentiment_flow: number;
}

export interface FullSnapshot {
  global_mood: GlobalMood;
  communities: CommunityMood[];
  live_feed: LivePost[];
  trends: Trend[];
  insights: AIInsight[];
  history: MoodHistoryPoint[];
  network_nodes: NetworkNode[];
  network_edges: NetworkEdge[];
}

export const EMOTION_COLORS: Record<Emotion, string> = {
  EUPHORIC: "#ffd700",
  EXCITED: "#ff6b35",
  HOPEFUL: "#00d4aa",
  NOSTALGIC: "#9b59b6",
  NEUTRAL: "#64748b",
  ANXIOUS: "#ffb700",
  MELANCHOLIC: "#3b82f6",
  ANGRY: "#ff3366",
  DEPRESSED: "#334155",
  CHAOTIC: "#ff00ff",
};

export const EMOTION_GLOW: Record<Emotion, string> = {
  EUPHORIC: "rgba(255, 215, 0, 0.5)",
  EXCITED: "rgba(255, 107, 53, 0.5)",
  HOPEFUL: "rgba(0, 212, 170, 0.5)",
  NOSTALGIC: "rgba(155, 89, 182, 0.5)",
  NEUTRAL: "rgba(100, 116, 139, 0.3)",
  ANXIOUS: "rgba(255, 183, 0, 0.5)",
  MELANCHOLIC: "rgba(59, 130, 246, 0.5)",
  ANGRY: "rgba(255, 51, 102, 0.5)",
  DEPRESSED: "rgba(51, 65, 85, 0.3)",
  CHAOTIC: "rgba(255, 0, 255, 0.5)",
};

export const PLATFORM_COLORS: Record<string, string> = {
  reddit: "#ff4500",
  twitter: "#1da1f2",
  youtube: "#ff0000",
  news: "#00f0ff",
  tiktok: "#ff0050",
  discord: "#5865f2",
};
