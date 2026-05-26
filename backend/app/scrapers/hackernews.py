"""
Hacker News scraper — no API key required.

Fetches top stories from the HN Firebase API, scores titles with VADER,
and pushes real scores into state.real_scores for the technology, science,
and techtwitter communities.
"""

import asyncio
import logging
import uuid
from datetime import datetime, timezone

import httpx

from ..models import LivePost
from ..sentiment import analyze
from ..state import InternetMoodState

logger = logging.getLogger(__name__)

_TOP_URL = "https://hacker-news.firebaseio.com/v1/topstories.json"
_ITEM_URL = "https://hacker-news.firebaseio.com/v1/item/{}.json"

# Communities that HN data feeds into
COMMUNITIES = ("technology", "science", "techtwitter")


async def _fetch_stories(limit: int = 40) -> list[str]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(_TOP_URL)
        r.raise_for_status()
        ids = r.json()[:limit]

        responses = await asyncio.gather(
            *[client.get(_ITEM_URL.format(i)) for i in ids],
            return_exceptions=True,
        )

    titles = []
    for resp in responses:
        if isinstance(resp, Exception):
            continue
        try:
            data = resp.json()
            title = data.get("title", "").strip()
            if title:
                titles.append(title)
        except Exception:
            continue
    return titles


async def scrape(state: InternetMoodState) -> None:
    try:
        titles = await _fetch_stories(40)
        if not titles:
            return

        results = [analyze(t) for t in titles]
        scores = [r["score"] for r in results]
        avg = sum(scores) / len(scores)

        for cid in COMMUNITIES:
            state.real_scores[cid] = avg

        # Add a few real posts to the live feed
        now = datetime.now(timezone.utc).isoformat()
        for title, result in zip(titles[:6], results[:6]):
            state.add_post(LivePost(
                id=str(uuid.uuid4())[:8],
                platform="hackernews",
                community="technology",
                content=title[:280],
                sentiment=result["label"],
                score=round(result["score"], 3),
                timestamp=now,
            ))

        logger.info("HN: %d stories scraped, avg score %.3f", len(titles), avg)

    except Exception as exc:
        logger.warning("HN scrape failed: %s", exc)
