"""
NewsAPI scraper — requires a free NEWS_API_KEY from https://newsapi.org

Fetches top US headlines, scores them with VADER, and pushes real scores
into state.real_scores for the worldnews, newsheadlines, and politics
communities. Silently skips if NEWS_API_KEY is not set.
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

_URL = "https://newsapi.org/v2/top-headlines"

COMMUNITIES = ("worldnews", "newsheadlines", "politics")


async def scrape(state: InternetMoodState) -> None:
    api_key = os.getenv("NEWS_API_KEY", "")
    if not api_key:
        logger.debug("NEWS_API_KEY not set — skipping NewsAPI scrape")
        return

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(_URL, params={
                "country": "us",
                "pageSize": 40,
                "apiKey": api_key,
            })
            resp.raise_for_status()
            articles = resp.json().get("articles", [])

        if not articles:
            return

        scores = []
        posts = []
        now = datetime.now(timezone.utc).isoformat()

        for article in articles:
            title = (article.get("title") or "").strip()
            desc = (article.get("description") or "").strip()
            text = f"{title}. {desc}".strip(". ") if desc else title
            if not text or text == "[Removed]":
                continue

            result = analyze(text)
            scores.append(result["score"])
            posts.append(LivePost(
                id=str(uuid.uuid4())[:8],
                platform="news",
                community="newsheadlines",
                content=title[:280],
                sentiment=result["label"],
                score=round(result["score"], 3),
                timestamp=now,
            ))

        if not scores:
            return

        avg = sum(scores) / len(scores)

        for cid in COMMUNITIES:
            state.real_scores[cid] = avg

        for post in posts[:6]:
            state.add_post(post)

        logger.info("NewsAPI: %d headlines scraped, avg score %.3f", len(scores), avg)

    except Exception as exc:
        logger.warning("NewsAPI scrape failed: %s", exc)
