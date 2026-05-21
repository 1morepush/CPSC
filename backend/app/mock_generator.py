import asyncio
import random
import math
import uuid
from datetime import datetime, timezone

from .models import (
    GlobalMood, CommunityMood, LivePost, Trend,
    AIInsight, NetworkNode, NetworkEdge,
)
from .sentiment import score_to_emotion
from .state import InternetMoodState

# ── Community definitions ──────────────────────────────────────────────────

COMMUNITIES = [
    {"id": "worldnews",    "name": "r/worldnews",      "platform": "reddit",  "base": -0.30, "vol": 0.40},
    {"id": "gaming",       "name": "r/gaming",          "platform": "reddit",  "base":  0.20, "vol": 0.30},
    {"id": "technology",   "name": "r/technology",      "platform": "reddit",  "base":  0.30, "vol": 0.20},
    {"id": "politics",     "name": "r/politics",        "platform": "reddit",  "base": -0.40, "vol": 0.55},
    {"id": "wsb",          "name": "r/wallstreetbets",  "platform": "reddit",  "base":  0.05, "vol": 0.85},
    {"id": "science",      "name": "r/science",         "platform": "reddit",  "base":  0.40, "vol": 0.15},
    {"id": "aww",          "name": "r/aww",             "platform": "reddit",  "base":  0.88, "vol": 0.08},
    {"id": "memes",        "name": "r/memes",           "platform": "reddit",  "base":  0.15, "vol": 0.50},
    {"id": "fintwit",      "name": "FinTwit",           "platform": "twitter", "base": -0.10, "vol": 0.65},
    {"id": "musictwitter", "name": "MusicTwitter",      "platform": "twitter", "base":  0.45, "vol": 0.30},
    {"id": "techtwitter",  "name": "TechTwitter",       "platform": "twitter", "base":  0.25, "vol": 0.40},
    {"id": "gamedtube",    "name": "Gaming YouTube",    "platform": "youtube", "base":  0.30, "vol": 0.35},
    {"id": "newsheadlines","name": "News Headlines",    "platform": "news",    "base": -0.20, "vol": 0.30},
]

# ── Network edges (community connections) ────────────────────────────────────

STATIC_EDGES = [
    ("worldnews", "politics"),
    ("worldnews", "newsheadlines"),
    ("politics",  "fintwit"),
    ("gaming",    "gamedtube"),
    ("gaming",    "memes"),
    ("technology","techtwitter"),
    ("technology","science"),
    ("wsb",       "fintwit"),
    ("wsb",       "techtwitter"),
    ("memes",     "musictwitter"),
    ("aww",       "memes"),
    ("musictwitter","gamedtube"),
]

# ── Sample post templates ──────────────────────────────────────────────────

POSTS = {
    "positive": [
        "This is absolutely incredible! Best thing I've seen all week 🙌",
        "Can't believe how good this turned out. Mind completely blown.",
        "Loving the energy right now — things are genuinely looking up.",
        "This actually restored my faith in humanity, no joke.",
        "We did it. Absolute legends. The community came through.",
        "Whatever is happening today, I am HERE for it 🔥",
        "Unironically one of the best moments of the year so far.",
        "The nostalgia just hit different. Feeling emotional ngl.",
        "Positive vibes incoming — bookmark this moment.",
        "Why does everything feel so good today?? Not complaining.",
    ],
    "negative": [
        "This is a complete disaster, can't believe this is happening again.",
        "So incredibly frustrated right now. Words can't describe.",
        "The situation keeps getting worse and nobody seems to care.",
        "Hard to stay optimistic when you see news like this.",
        "At what point do we admit things are not going well at all?",
        "Watching this unfold in real time is genuinely disturbing.",
        "Peak clown world. I have no more reactions left.",
        "Woke up to THIS? Today is off to a terrible start.",
        "The system is broken and this just proved it again.",
        "Tired. Just really, really tired of all of it.",
    ],
    "neutral": [
        "Interesting development. Will be watching this closely.",
        "More updates coming in. Stay tuned for further analysis.",
        "Sources are conflicting right now. Wait for more info.",
        "This has been trending for a few hours. Not sure where it goes.",
        "Third time this week this topic has dominated the feed.",
        "Mixed reactions across platforms. The divide is real.",
        "Numbers are still coming in. Too early to say for certain.",
        "The discourse continues. Same as yesterday, more or less.",
        "People are talking about this, make of that what you will.",
        "Neither here nor there on this one. Could go either way.",
    ],
}

# ── Random event definitions ───────────────────────────────────────────────

EVENTS = [
    {"title": "Breaking: Major global event unfolds",          "shift": -0.35, "duration": 180, "affected": ["worldnews","politics","newsheadlines"]},
    {"title": "Viral: Heartwarming moment sweeps the internet","shift":  0.40, "duration":  90, "affected": ["aww","memes","musictwitter"]},
    {"title": "Markets: Sudden flash crash sparks panic",       "shift": -0.50, "duration": 120, "affected": ["wsb","fintwit","techtwitter"]},
    {"title": "Launch: Highly-anticipated game drops early",    "shift":  0.55, "duration": 150, "affected": ["gaming","gamedtube","memes"]},
    {"title": "Controversy: Major drama breaks out online",     "shift": -0.30, "duration": 240, "affected": ["politics","memes","worldnews"]},
    {"title": "Discovery: Groundbreaking science published",    "shift":  0.45, "duration":  60, "affected": ["science","technology","techtwitter"]},
    {"title": "Music: Album drop dominates all conversations",  "shift":  0.50, "duration": 120, "affected": ["musictwitter","memes","gamedtube"]},
    {"title": "Outage: Major platform goes down globally",      "shift": -0.20, "duration":  60, "affected": ["techtwitter","wsb","memes"]},
]

AI_TEMPLATES = [
    ("Gaming communities show elevated excitement — a major release appears imminent.", "pattern", "info"),
    ("Internet anxiety spiked 34% following recent global news coverage.", "spike", "moderate"),
    ("Nostalgia content is surging across all platforms — expect emotional retrospectives.", "pattern", "info"),
    ("FinTwit sentiment reversed sharply in the last 15 minutes. Watch for cascade.", "shift", "high"),
    ("r/aww is singlehandedly keeping the global mood index positive right now.", "pattern", "info"),
    ("Sentiment divergence between political and gaming spaces is at a 6-hour high.", "shift", "moderate"),
    ("Viral velocity on {trend} is accelerating beyond normal parameters.", "spike", "high"),
    ("Emotional propagation from worldnews → politics → fintwit detected. Cascading.", "warning", "high"),
    ("Three distinct mood clusters forming: joyful niches, anxious news consumers, volatile traders.", "pattern", "moderate"),
    ("Cultural saturation approaching on current meme cycle — expect irony inversion soon.", "pattern", "info"),
    ("Internet energy index crossed 80 — unusually high posting intensity for this hour.", "spike", "moderate"),
    ("Community fragmentation increasing. The internet is not feeling one thing right now.", "shift", "moderate"),
    ("Positive sentiment wave originated in r/aww and has now reached mainstream feeds.", "shift", "info"),
    ("Breaking news cycle detected. Expect volatility for the next 2-3 hours.", "warning", "high"),
    ("Music Twitter driving overall mood uplift — currently the most positive active community.", "pattern", "info"),
]


class MoodDataGenerator:
    """Continuously generates realistic mock internet mood data."""

    def __init__(self, state: InternetMoodState):
        self.state = state
        self._tick = 0
        self._community_scores: dict[str, float] = {
            c["id"]: c["base"] for c in COMMUNITIES
        }
        self._active_event: dict | None = None
        self._event_ends_tick: int = 0
        self._init_network()
        self._init_communities()
        self._init_trends()

    # ── Bootstrap ─────────────────────────────────────────────────────────────

    def _init_network(self):
        nodes = [
            NetworkNode(
                id=c["id"], name=c["name"], platform=c["platform"],
                score=c["base"], emotion=score_to_emotion(c["base"], c["vol"]),
                size=random.uniform(0.4, 1.0),
            )
            for c in COMMUNITIES
        ]
        edges = [
            NetworkEdge(
                source=s, target=t,
                strength=random.uniform(0.3, 0.9),
                sentiment_flow=random.uniform(-0.5, 0.5),
            )
            for s, t in STATIC_EDGES
        ]
        self.state.update_network(nodes, edges)

    def _init_communities(self):
        self.state.update_communities(self._build_communities())

    def _init_trends(self):
        self.state.update_trends(self._build_trends())

    # ── Main loop ─────────────────────────────────────────────────────────────

    async def run_continuous(self):
        while True:
            self._tick += 1
            self._maybe_trigger_event()
            self._generate_posts(count=random.randint(2, 4))

            if self._tick % 5 == 0:
                self._update_community_scores()
                self._update_global_mood()

            if self._tick % 15 == 0:
                self.state.update_communities(self._build_communities())
                self._update_network()

            if self._tick % 25 == 0:
                self.state.update_trends(self._build_trends())

            if self._tick % 30 == 0:
                self._emit_insight()

            await asyncio.sleep(2)

    # ── Generators ─────────────────────────────────────────────────────────────

    def _maybe_trigger_event(self):
        if self._active_event and self._tick < self._event_ends_tick:
            return
        self._active_event = None
        if random.random() < 0.012:  # ~1.2% chance per tick ≈ event every few minutes
            event = random.choice(EVENTS)
            self._active_event = event
            self._event_ends_tick = self._tick + event["duration"] // 2
            for cid in event["affected"]:
                self._community_scores[cid] = max(-1.0, min(1.0,
                    self._community_scores[cid] + event["shift"] * random.uniform(0.7, 1.3)
                ))

    def _generate_posts(self, count: int):
        for _ in range(count):
            comm = random.choice(COMMUNITIES)
            base_score = self._community_scores[comm["id"]]
            score = max(-1.0, min(1.0,
                base_score + random.gauss(0, comm["vol"] * 0.3)
            ))
            label = "positive" if score > 0.05 else ("negative" if score < -0.05 else "neutral")
            content = random.choice(POSTS[label])
            post = LivePost(
                id=str(uuid.uuid4())[:8],
                platform=comm["platform"],
                community=comm["name"],
                content=content,
                sentiment=label,
                score=round(score, 3),
                timestamp=datetime.now(timezone.utc).isoformat(),
            )
            self.state.add_post(post)

    def _update_community_scores(self):
        for c in COMMUNITIES:
            cid = c["id"]
            drift = random.gauss(0, c["vol"] * 0.05)
            reversion = (c["base"] - self._community_scores[cid]) * 0.03
            self._community_scores[cid] = max(-1.0, min(1.0,
                self._community_scores[cid] + drift + reversion
            ))

    def _build_communities(self) -> list[CommunityMood]:
        result = []
        for c in COMMUNITIES:
            score = self._community_scores[c["id"]]
            prev = c["base"]
            if score - prev > 0.05:
                trend = "rising"
            elif score - prev < -0.05:
                trend = "falling"
            else:
                trend = "stable"
            result.append(CommunityMood(
                id=c["id"],
                name=c["name"],
                platform=c["platform"],
                emotion=score_to_emotion(score, c["vol"] * random.uniform(0.5, 1.0)),
                score=round(score, 3),
                trend=trend,
                post_count=random.randint(50, 2000),
                intensity=round(abs(score) * 0.7 + random.uniform(0, 0.3), 3),
            ))
        return result

    def _update_global_mood(self):
        scores = list(self._community_scores.values())
        avg = sum(scores) / len(scores)
        volatility = _std(scores)
        prev_score = self.state.global_mood.score
        drift = avg - prev_score
        intensity = round(abs(avg) * 0.6 + volatility * 0.4, 3)
        energy = round(
            50 + avg * 25 + volatility * 15 + math.sin(self._tick * 0.1) * 5
            + (20 if self._active_event else 0),
            1
        )
        emotion = score_to_emotion(avg, volatility)
        self.state.update_global_mood(GlobalMood(
            emotion=emotion,
            score=round(avg, 3),
            intensity=min(1.0, intensity),
            volatility=round(min(1.0, volatility), 3),
            drift=round(drift, 3),
            energy_index=min(100.0, max(0.0, energy)),
            timestamp=datetime.now(timezone.utc).isoformat(),
            active_event=self._active_event["title"] if self._active_event else None,
        ))

    def _update_network(self):
        nodes = [
            NetworkNode(
                id=c["id"], name=c["name"], platform=c["platform"],
                score=round(self._community_scores[c["id"]], 3),
                emotion=score_to_emotion(
                    self._community_scores[c["id"]], c["vol"]
                ),
                size=round(abs(self._community_scores[c["id"]]) * 0.5 + 0.5, 3),
            )
            for c in COMMUNITIES
        ]
        edges = [
            NetworkEdge(
                source=s, target=t,
                strength=round(random.uniform(0.3, 0.9), 3),
                sentiment_flow=round(
                    self._community_scores.get(s, 0) - self._community_scores.get(t, 0),
                    3
                ),
            )
            for s, t in STATIC_EDGES
        ]
        self.state.update_network(nodes, edges)

    def _build_trends(self) -> list[Trend]:
        topics = [
            ("AI model releases", "twitter", "technology"),
            ("GameX launch week", "reddit", "gaming"),
            ("Market volatility spike", "twitter", "finance"),
            ("Viral meme format", "reddit", "culture"),
            ("Breaking geopolitical news", "news", "world"),
            ("New music album drop", "twitter", "music"),
            ("Tech layoff wave", "twitter", "technology"),
            ("Nostalgia content surge", "reddit", "culture"),
            ("Climate policy debate", "twitter", "world"),
            ("Speedrun world record broken", "youtube", "gaming"),
        ]
        trends = []
        for i, (title, platform, category) in enumerate(random.sample(topics, 6)):
            hype = random.uniform(30, 99)
            vel = random.uniform(0.1, 5.0)
            avg_score = sum(self._community_scores.values()) / len(self._community_scores)
            sent_label = "positive" if avg_score > 0.05 else ("negative" if avg_score < -0.05 else "neutral")
            trends.append(Trend(
                id=f"trend_{i}",
                title=title,
                platform=platform,
                hype_score=round(hype, 1),
                viral_velocity=round(vel, 2),
                sentiment=sent_label,
                volume=random.randint(1000, 500000),
                category=category,
            ))
        trends.sort(key=lambda t: t.hype_score, reverse=True)
        return trends

    def _emit_insight(self):
        template, category, severity = random.choice(AI_TEMPLATES)
        trends = self.state.trends
        trend_title = trends[0].title if trends else "trending topic"
        text = template.replace("{trend}", trend_title)
        self.state.add_insight(AIInsight(
            id=str(uuid.uuid4())[:8],
            text=text,
            category=category,
            severity=severity,
            timestamp=datetime.now(timezone.utc).isoformat(),
        ))


def _std(values: list[float]) -> float:
    if not values:
        return 0.0
    mean = sum(values) / len(values)
    variance = sum((v - mean) ** 2 for v in values) / len(values)
    return variance ** 0.5
