"""
Mastodon scraper — free public API, no authentication required.

Reads public timelines from mastodon.social to approximate sentiment
for the Twitter-mapped communities: FinTwit, MusicTwitter, TechTwitter.

Uses tag-based timelines (no auth needed) to stay free forever.
Set MASTODON_INSTANCE to use a different instance (default: mastodon.social).
"""

import logging
import os
import uuid
from datetime import datetime, timezone

import httpx

from ..models import LivePost
from ..sentiment import analyze
from ..state import InternetMoodState

logger = logging.getLogger(__name__)

INSTANCE = os.getenv("MASTODON_INSTANCE", "mastodon.social")

# Maps Mastodon hashtags → community ids
TAG_MAP = {
    "finance":   "fintwit",
    "investing": "fintwit",
    "music":     "musictwitter",
    "nowplaying":"musictwitter",
    "tech":      "techtwitter",
    "programming":"techtwitter",
}

_POSTS_PER_TAG = 20


async def scrape(state: InternetMoodState) -> None:
    now = datetime.now(timezone.utc).isoformat()
    community_scores: dict[str, list[float]] = {}

    async with httpx.AsyncClient(timeout=10.0) as client:
        for tag, community_id in TAG_MAP.items():
            try:
                statuses = await _fetch_tag(client, tag)
                if not statuses:
                    continue

                scores = []
                for status in statuses:
                    text = _strip_html(status.get("content", "")).strip()
                    if not text:
                        continue
                    result = analyze(text[:300])
                    scores.append(result["score"])

                    # Add one post per tag to the feed
                    if len(scores) == 1:
                        state.add_post(LivePost(
                            id=str(uuid.uuid4())[:8],
                            platform="mastodon",
                            community=community_id,
                            content=text[:280],
                            sentiment=result["label"],
                            score=round(result["score"], 3),
                            timestamp=now,
                        ))

                if scores:
                    community_scores.setdefault(community_id, []).extend(scores)
                    logger.debug("Mastodon #%s: %d posts", tag, len(scores))

            except Exception as exc:
                logger.warning("Mastodon #%s failed: %s", tag, exc)

    # Average across all tags that feed into a community
    for community_id, scores in community_scores.items():
        state.real_scores[community_id] = sum(scores) / len(scores)

    logger.info("Mastodon: updated %d communities", len(community_scores))


async def _fetch_tag(client: httpx.AsyncClient, tag: str) -> list[dict]:
    resp = await client.get(
        f"https://{INSTANCE}/api/v1/timelines/tag/{tag}",
        params={"limit": _POSTS_PER_TAG},
    )
    resp.raise_for_status()
    return resp.json()


def _strip_html(html: str) -> str:
    """Remove HTML tags from Mastodon post content."""
    import re
    text = re.sub(r"<br\s*/?>", " ", html)
    text = re.sub(r"<[^>]+>", "", text)
    return text
