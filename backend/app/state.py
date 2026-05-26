from collections import deque
from threading import Lock
from datetime import datetime, timezone
from typing import Optional
import uuid

from .models import (
    GlobalMood, CommunityMood, LivePost, Trend,
    AIInsight, MoodHistoryPoint, NetworkNode, NetworkEdge, FullSnapshot
)


class InternetMoodState:
    """Thread-safe in-memory store for all real-time mood data."""

    def __init__(self):
        self._lock = Lock()
        self.post_window: deque[LivePost] = deque(maxlen=200)
        self.history: deque[MoodHistoryPoint] = deque(maxlen=288)  # 24h at 5min
        self.global_mood: GlobalMood = _default_mood()
        self.communities: list[CommunityMood] = []
        self.trends: list[Trend] = []
        self.insights: deque[AIInsight] = deque(maxlen=20)
        self.network_nodes: list[NetworkNode] = []
        self.network_edges: list[NetworkEdge] = []
        # Scrapers write live scores here; mock generator blends toward them
        self.real_scores: dict[str, float] = {}

    # ── readers ───────────────────────────────────────────────────────────────

    def snapshot(self) -> FullSnapshot:
        with self._lock:
            return FullSnapshot(
                global_mood=self.global_mood,
                communities=list(self.communities),
                live_feed=list(self.post_window)[-30:],
                trends=list(self.trends),
                insights=list(self.insights),
                history=list(self.history),
                network_nodes=list(self.network_nodes),
                network_edges=list(self.network_edges),
            )

    def live_update(self) -> dict:
        with self._lock:
            posts = list(self.post_window)[-5:]
            return {
                "type": "live_update",
                "global_mood": self.global_mood.model_dump(),
                "latest_posts": [p.model_dump() for p in posts],
                "communities": [c.model_dump() for c in self.communities],
                "trends": [t.model_dump() for t in self.trends],
                "latest_insight": (
                    list(self.insights)[-1].model_dump()
                    if self.insights else None
                ),
                "network_nodes": [n.model_dump() for n in self.network_nodes],
                "network_edges": [e.model_dump() for e in self.network_edges],
                "history": [h.model_dump() for h in list(self.history)[-60:]],
            }

    # ── writers ───────────────────────────────────────────────────────────────

    def add_post(self, post: LivePost):
        with self._lock:
            self.post_window.append(post)

    def update_global_mood(self, mood: GlobalMood):
        with self._lock:
            self.global_mood = mood
            self.history.append(MoodHistoryPoint(
                timestamp=mood.timestamp,
                score=mood.score,
                intensity=mood.intensity,
                emotion=mood.emotion,
                event=mood.active_event,
            ))

    def update_communities(self, communities: list[CommunityMood]):
        with self._lock:
            self.communities = communities

    def update_trends(self, trends: list[Trend]):
        with self._lock:
            self.trends = trends

    def add_insight(self, insight: AIInsight):
        with self._lock:
            self.insights.append(insight)

    def update_network(self, nodes: list[NetworkNode], edges: list[NetworkEdge]):
        with self._lock:
            self.network_nodes = nodes
            self.network_edges = edges


def _default_mood() -> GlobalMood:
    return GlobalMood(
        emotion="NEUTRAL",
        score=0.0,
        intensity=0.5,
        volatility=0.3,
        drift=0.0,
        energy_index=50.0,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
