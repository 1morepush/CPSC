import type {
  FullSnapshot, GlobalMood, CommunityMood, LivePost,
  Trend, AIInsight, MoodHistoryPoint, NetworkNode, NetworkEdge,
  Emotion, SentimentLabel,
} from "./types";
import { EMOTION_COLORS } from "./types";
import type { MoodData } from "@/hooks/useMoodData";

let _tick = 0;
const _scores: Record<string, number> = {};

const COMMUNITIES_DEF = [
  { id: "worldnews",    name: "r/worldnews",     platform: "reddit",  base: -0.30, vol: 0.40 },
  { id: "gaming",       name: "r/gaming",         platform: "reddit",  base:  0.20, vol: 0.30 },
  { id: "technology",   name: "r/technology",     platform: "reddit",  base:  0.30, vol: 0.20 },
  { id: "politics",     name: "r/politics",       platform: "reddit",  base: -0.40, vol: 0.55 },
  { id: "wsb",          name: "r/wallstreetbets", platform: "reddit",  base:  0.05, vol: 0.85 },
  { id: "science",      name: "r/science",        platform: "reddit",  base:  0.40, vol: 0.15 },
  { id: "aww",          name: "r/aww",            platform: "reddit",  base:  0.88, vol: 0.08 },
  { id: "memes",        name: "r/memes",          platform: "reddit",  base:  0.15, vol: 0.50 },
  { id: "fintwit",      name: "FinTwit",          platform: "twitter", base: -0.10, vol: 0.65 },
  { id: "musictwitter", name: "MusicTwitter",     platform: "twitter", base:  0.45, vol: 0.30 },
  { id: "techtwitter",  name: "TechTwitter",      platform: "twitter", base:  0.25, vol: 0.40 },
  { id: "gamedtube",    name: "Gaming YouTube",   platform: "youtube", base:  0.30, vol: 0.35 },
  { id: "newsheadlines",name: "News Headlines",   platform: "news",    base: -0.20, vol: 0.30 },
];

// Init scores
COMMUNITIES_DEF.forEach(c => { _scores[c.id] = c.base; });

const STATIC_EDGES: [string, string][] = [
  ["worldnews","politics"], ["worldnews","newsheadlines"], ["politics","fintwit"],
  ["gaming","gamedtube"],   ["gaming","memes"],            ["technology","techtwitter"],
  ["technology","science"], ["wsb","fintwit"],             ["wsb","techtwitter"],
  ["memes","musictwitter"], ["aww","memes"],               ["musictwitter","gamedtube"],
];

const POSTS_POS = [
  "This is absolutely incredible! Best thing I've seen all week 🙌",
  "Can't believe how good this turned out. Mind completely blown.",
  "Loving the energy right now — things are genuinely looking up.",
  "This actually restored my faith in humanity, no joke.",
  "We did it. Absolute legends. The community came through.",
  "Whatever is happening today, I am HERE for it 🔥",
  "Unironically one of the best moments of the year so far.",
  "The nostalgia just hit different. Feeling emotional ngl.",
  "Positive vibes incoming — bookmark this moment.",
];
const POSTS_NEG = [
  "This is a complete disaster, can't believe this is happening again.",
  "So incredibly frustrated right now. Words can't describe.",
  "The situation keeps getting worse and nobody seems to care.",
  "Hard to stay optimistic when you see news like this.",
  "At what point do we admit things are not going well at all?",
  "Watching this unfold in real time is genuinely disturbing.",
  "Peak clown world. I have no more reactions left.",
  "Tired. Just really, really tired of all of it.",
];
const POSTS_NEU = [
  "Interesting development. Will be watching this closely.",
  "More updates coming in. Stay tuned for further analysis.",
  "Sources are conflicting right now. Wait for more info.",
  "This has been trending for a few hours. Not sure where it goes.",
  "Mixed reactions across platforms. The divide is real.",
  "Numbers are still coming in. Too early to say for certain.",
];

const AI_INSIGHTS = [
  { text: "Gaming communities show elevated excitement — a major release appears imminent.", category: "pattern" as const, severity: "info" as const },
  { text: "Internet anxiety spiked 34% following recent global news coverage.", category: "spike" as const, severity: "moderate" as const },
  { text: "Nostalgia content is surging across all platforms — expect emotional retrospectives.", category: "pattern" as const, severity: "info" as const },
  { text: "FinTwit sentiment reversed sharply in the last 15 minutes. Watch for cascade effects.", category: "shift" as const, severity: "high" as const },
  { text: "r/aww is singlehandedly keeping the global mood index positive right now.", category: "pattern" as const, severity: "info" as const },
  { text: "Sentiment divergence between political and gaming spaces is at a 6-hour high.", category: "shift" as const, severity: "moderate" as const },
  { text: "Emotional propagation from worldnews → politics → fintwit detected. Cascading.", category: "warning" as const, severity: "high" as const },
  { text: "Three distinct mood clusters forming: joyful niches, anxious news consumers, volatile traders.", category: "pattern" as const, severity: "moderate" as const },
  { text: "Internet energy index crossed 80 — unusually high posting intensity for this hour.", category: "spike" as const, severity: "moderate" as const },
  { text: "Music Twitter driving overall mood uplift — currently the most positive active community.", category: "pattern" as const, severity: "info" as const },
  { text: "Breaking news cycle detected. Expect volatility for the next 2-3 hours.", category: "warning" as const, severity: "high" as const },
  { text: "Cultural saturation approaching on current meme cycle — expect irony inversion soon.", category: "pattern" as const, severity: "info" as const },
];

let _insightIdx = 0;

function rand(min: number, max: number) { return min + Math.random() * (max - min); }
function gauss(mean: number, std: number) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

function scoreToEmotion(score: number, volatility: number = 0): Emotion {
  if (volatility > 0.82) return "CHAOTIC";
  if (score > 0.75) return "EUPHORIC";
  if (score > 0.40) return "EXCITED";
  if (score > 0.10) return "HOPEFUL";
  if (score > -0.10) return "NEUTRAL";
  if (score > -0.30) return "MELANCHOLIC";
  if (score > -0.60) return "ANXIOUS";
  if (score > -0.85) return "ANGRY";
  return "DEPRESSED";
}

function buildHistory(): MoodHistoryPoint[] {
  const pts: MoodHistoryPoint[] = [];
  let score = 0;
  const now = Date.now();
  for (let i = 60; i >= 0; i--) {
    score = clamp(score + gauss(0, 0.08), -0.9, 0.9);
    pts.push({
      timestamp: new Date(now - i * 5 * 60 * 1000).toISOString(),
      score: parseFloat(score.toFixed(3)),
      intensity: parseFloat((Math.abs(score) * 0.7 + rand(0, 0.3)).toFixed(3)),
      emotion: scoreToEmotion(score),
    });
  }
  return pts;
}

function buildNetworkNodes(): NetworkNode[] {
  return COMMUNITIES_DEF.map(c => ({
    id: c.id, name: c.name, platform: c.platform,
    score: parseFloat(_scores[c.id].toFixed(3)),
    emotion: scoreToEmotion(_scores[c.id], c.vol),
    size: parseFloat((Math.abs(_scores[c.id]) * 0.5 + 0.5).toFixed(3)),
  }));
}

function buildNetworkEdges(): NetworkEdge[] {
  return STATIC_EDGES.map(([s, t]) => ({
    source: s, target: t,
    strength: parseFloat(rand(0.3, 0.9).toFixed(3)),
    sentiment_flow: parseFloat((_scores[s] - _scores[t]).toFixed(3)),
  }));
}

function buildCommunities(): CommunityMood[] {
  return COMMUNITIES_DEF.map(c => {
    const score = _scores[c.id];
    const trend = score > c.base + 0.05 ? "rising" : score < c.base - 0.05 ? "falling" : "stable";
    return {
      id: c.id, name: c.name, platform: c.platform,
      emotion: scoreToEmotion(score, c.vol * rand(0.5, 1.0)),
      score: parseFloat(score.toFixed(3)),
      trend: trend as "rising" | "falling" | "stable",
      post_count: Math.floor(rand(50, 2000)),
      intensity: parseFloat(clamp(Math.abs(score) * 0.7 + rand(0, 0.3), 0, 1).toFixed(3)),
    };
  });
}

function buildTrends(): Trend[] {
  const topics = [
    { title: "AI model releases", platform: "twitter", category: "technology" },
    { title: "GameX launch week",  platform: "reddit",  category: "gaming" },
    { title: "Market volatility",  platform: "twitter", category: "finance" },
    { title: "Viral meme format",  platform: "reddit",  category: "culture" },
    { title: "Breaking world news",platform: "news",    category: "world" },
    { title: "New album drop",     platform: "twitter", category: "music" },
  ];
  const avg = Object.values(_scores).reduce((a, b) => a + b, 0) / COMMUNITIES_DEF.length;
  return topics.map((t, i) => ({
    id: `trend_${i}`, ...t,
    hype_score: parseFloat(rand(30, 99).toFixed(1)),
    viral_velocity: parseFloat(rand(0.1, 5.0).toFixed(2)),
    sentiment: (avg > 0.05 ? "positive" : avg < -0.05 ? "negative" : "neutral") as SentimentLabel,
    volume: Math.floor(rand(1000, 500000)),
  })).sort((a, b) => b.hype_score - a.hype_score);
}

function buildGlobalMood(history: MoodHistoryPoint[]): GlobalMood {
  const scores = Object.values(_scores);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((a, b) => a + (b - avg) ** 2, 0) / scores.length;
  const volatility = Math.sqrt(variance);
  const prev = history.length > 0 ? history[history.length - 1].score : 0;
  return {
    emotion: scoreToEmotion(avg, volatility),
    score: parseFloat(avg.toFixed(3)),
    intensity: parseFloat(clamp(Math.abs(avg) * 0.6 + volatility * 0.4, 0, 1).toFixed(3)),
    volatility: parseFloat(clamp(volatility, 0, 1).toFixed(3)),
    drift: parseFloat((avg - prev).toFixed(3)),
    energy_index: parseFloat(clamp(50 + avg * 25 + volatility * 15, 0, 100).toFixed(1)),
    timestamp: new Date().toISOString(),
  };
}

function generatePosts(count: number): LivePost[] {
  const posts: LivePost[] = [];
  for (let i = 0; i < count; i++) {
    const c = COMMUNITIES_DEF[Math.floor(Math.random() * COMMUNITIES_DEF.length)];
    const score = clamp(gauss(_scores[c.id], c.vol * 0.3), -1, 1);
    const label: SentimentLabel = score > 0.05 ? "positive" : score < -0.05 ? "negative" : "neutral";
    const pool = label === "positive" ? POSTS_POS : label === "negative" ? POSTS_NEG : POSTS_NEU;
    posts.push({
      id: Math.random().toString(36).slice(2, 10),
      platform: c.platform,
      community: c.name,
      content: pool[Math.floor(Math.random() * pool.length)],
      sentiment: label,
      score: parseFloat(score.toFixed(3)),
      timestamp: new Date().toISOString(),
    });
  }
  return posts;
}

export function generateDemoSnapshot(): FullSnapshot {
  COMMUNITIES_DEF.forEach(c => { _scores[c.id] = c.base; });
  const history = buildHistory();
  return {
    global_mood: buildGlobalMood(history),
    communities: buildCommunities(),
    live_feed: generatePosts(15),
    trends: buildTrends(),
    insights: AI_INSIGHTS.slice(0, 5).map((ins, i) => ({
      ...ins, id: `ins_${i}`, timestamp: new Date().toISOString(),
    })),
    history,
    network_nodes: buildNetworkNodes(),
    network_edges: buildNetworkEdges(),
  };
}

export function generateDemoUpdate(prev: MoodData): MoodData {
  _tick += 1;

  // Drift community scores
  COMMUNITIES_DEF.forEach(c => {
    const drift = gauss(0, c.vol * 0.04);
    const reversion = (c.base - _scores[c.id]) * 0.025;
    _scores[c.id] = clamp(_scores[c.id] + drift + reversion, -1, 1);
  });

  const newPosts = generatePosts(Math.floor(rand(1, 4)));
  const newFeed = [...newPosts, ...prev.liveFeed].slice(0, 60);

  const history = prev.history.length > 0
    ? [...prev.history.slice(-59), {
        timestamp: new Date().toISOString(),
        score: parseFloat(
          clamp(gauss(prev.history[prev.history.length - 1].score, 0.06), -1, 1).toFixed(3)
        ),
        intensity: parseFloat(rand(0.2, 0.9).toFixed(3)),
        emotion: prev.globalMood?.emotion ?? "NEUTRAL",
      }]
    : prev.history;

  const newInsights = _tick % 15 === 0
    ? [
        {
          ...AI_INSIGHTS[_insightIdx % AI_INSIGHTS.length],
          id: Math.random().toString(36).slice(2, 10),
          timestamp: new Date().toISOString(),
        },
        ...prev.insights,
      ].slice(0, 20)
    : prev.insights;
  if (_tick % 15 === 0) _insightIdx += 1;

  return {
    globalMood: buildGlobalMood(history),
    communities: buildCommunities(),
    liveFeed: newFeed,
    trends: _tick % 12 === 0 ? buildTrends() : prev.trends,
    insights: newInsights,
    history,
    networkNodes: buildNetworkNodes(),
    networkEdges: buildNetworkEdges(),
    wsStatus: "demo",
  };
}
