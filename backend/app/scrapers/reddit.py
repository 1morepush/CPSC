"""
Reddit scraper using PRAW.

Fetches hot posts from the 8 Reddit communities already tracked,
scores them with VADER, and pushes real scores into state.real_scores.

Requires REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in the environment.
Register a free "script" app at https://www.reddit.com/prefs/apps
(use http://localhost:8080 as the redirect URI — it's never called).
"""

import asyncio
import logging
import os
import uuid
from datetime import datetime, timezone

import praw
import praw.exceptions

from ..models import LivePost
from ..sentiment import analyze
from ..state import InternetMoodState

logger = logging.getLogger(__name__)

# Maps subreddit name → community id in our state
SUBREDDIT_MAP = {
    "worldnews":      "worldnews",
    "gaming":         "gaming",
    "technology":     "technology",
    "politics":       "politics",
    "wallstreetbets": "wsb",
    "science":        "science",
    "aww":            "aww",
    "memes":          "memes",
}

_POSTS_PER_SUB = 25


def _make_reddit() -> praw.Reddit | None:
    client_id = os.getenv("REDDIT_CLIENT_ID", "")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET", "")
    user_agent = os.getenv("REDDIT_USER_AGENT", "InternetMoodTracker/1.0")
    if not client_id or not client_secret:
        return None
    return praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        user_agent=user_agent,
    )


async def scrape(state: InternetMoodState) -> None:
    reddit = _make_reddit()
    if reddit is None:
        logger.debug("REDDIT_CLIENT_ID/SECRET not set — skipping Reddit scrape")
        return

    now = datetime.now(timezone.utc).isoformat()

    for sub_name, community_id in SUBREDDIT_MAP.items():
        try:
            # PRAW is synchronous (blocking requests under the hood) — run it in
            # a thread so the event loop stays responsive between subreddits.
            posts_data = await asyncio.to_thread(_fetch_subreddit, reddit, sub_name)
            if not posts_data:
                continue

            scores = [r["score"] for r in posts_data]
            avg = sum(scores) / len(scores)
            state.real_scores[community_id] = avg

            # Add top 2 posts per subreddit to the live feed
            for item in posts_data[:2]:
                state.add_post(LivePost(
                    id=str(uuid.uuid4())[:8],
                    platform="reddit",
                    community=f"r/{sub_name}",
                    content=item["title"][:280],
                    sentiment=item["label"],
                    score=round(item["score"], 3),
                    timestamp=now,
                ))

            logger.debug("Reddit r/%s: %d posts, avg %.3f", sub_name, len(posts_data), avg)

        except praw.exceptions.PRAWException as exc:
            logger.warning("Reddit r/%s failed: %s", sub_name, exc)
        except Exception as exc:
            logger.warning("Reddit r/%s unexpected error: %s", sub_name, exc)

    covered = [k for k in SUBREDDIT_MAP.values() if k in state.real_scores]
    logger.info("Reddit: updated %d communities", len(covered))


def _fetch_subreddit(reddit: praw.Reddit, sub_name: str) -> list[dict]:
    subreddit = reddit.subreddit(sub_name)
    results = []
    for post in subreddit.hot(limit=_POSTS_PER_SUB):
        title = post.title.strip()
        if not title:
            continue
        result = analyze(title)
        results.append({"title": title, "score": result["score"], "label": result["label"]})
    return results
