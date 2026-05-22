from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class GlobalMood(BaseModel):
    emotion: str
    score: float          # -1.0 to 1.0
    intensity: float      # 0.0 to 1.0
    volatility: float     # 0.0 to 1.0
    drift: float          # change since last window
    energy_index: float   # composite "how online" score 0-100
    timestamp: str
    active_event: Optional[str] = None


class CommunityMood(BaseModel):
    id: str
    name: str
    platform: str
    emotion: str
    score: float
    trend: str            # "rising" | "falling" | "stable"
    post_count: int
    intensity: float


class LivePost(BaseModel):
    id: str
    platform: str
    community: str
    content: str
    sentiment: str        # "positive" | "negative" | "neutral"
    score: float
    timestamp: str


class Trend(BaseModel):
    id: str
    title: str
    platform: str
    hype_score: float     # 0-100
    viral_velocity: float # rate of spread
    sentiment: str
    volume: int
    category: str


class AIInsight(BaseModel):
    id: str
    text: str
    category: str         # "shift" | "spike" | "pattern" | "warning"
    severity: str         # "info" | "moderate" | "high"
    timestamp: str


class MoodHistoryPoint(BaseModel):
    timestamp: str
    score: float
    intensity: float
    emotion: str
    event: Optional[str] = None


class NetworkNode(BaseModel):
    id: str
    name: str
    platform: str
    score: float
    emotion: str
    size: float           # relative activity


class NetworkEdge(BaseModel):
    source: str
    target: str
    strength: float
    sentiment_flow: float  # direction of sentiment


class FullSnapshot(BaseModel):
    global_mood: GlobalMood
    communities: list[CommunityMood]
    live_feed: list[LivePost]
    trends: list[Trend]
    insights: list[AIInsight]
    history: list[MoodHistoryPoint]
    network_nodes: list[NetworkNode]
    network_edges: list[NetworkEdge]
