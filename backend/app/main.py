import asyncio
import contextlib
import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .state import InternetMoodState
from .mock_generator import MoodDataGenerator
from .api.routes import router

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mood_state = InternetMoodState()
generator = MoodDataGenerator(mood_state)

# Runtime mode flag — starts from env var, toggled via /api/mode
_demo_mode: bool = os.getenv("USE_DEMO_MODE", "true").lower() != "false"
mood_state.demo_mode = _demo_mode
_scraper_task: asyncio.Task | None = None


class ConnectionManager:
    def __init__(self):
        self._connections: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self._connections.append(ws)
        logger.info("WS client connected. Total: %d", len(self._connections))

    def disconnect(self, ws: WebSocket):
        self._connections.remove(ws)
        logger.info("WS client disconnected. Total: %d", len(self._connections))

    async def broadcast(self, data: dict):
        dead = []
        for ws in self._connections:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self._connections.remove(ws)


manager = ConnectionManager()


async def _run_scrapers():
    """Runs all scrapers on a fixed schedule."""
    from .scrapers import hackernews, newsapi, reddit, mastodon

    logger.info("Real-data mode: scrapers starting")

    await asyncio.sleep(3)
    await hackernews.scrape(mood_state)
    await asyncio.sleep(2)
    await mastodon.scrape(mood_state)
    await asyncio.sleep(2)
    await newsapi.scrape(mood_state)
    await asyncio.sleep(2)
    await reddit.scrape(mood_state)

    HN_INTERVAL       = 5  * 60
    MASTODON_INTERVAL = 5  * 60
    NEWS_INTERVAL     = 10 * 60
    REDDIT_INTERVAL   = 10 * 60

    elapsed = {k: 0 for k in ("hn", "mastodon", "news", "reddit")}
    tick = 30

    while True:
        await asyncio.sleep(tick)
        for k in elapsed:
            elapsed[k] += tick

        if elapsed["hn"] >= HN_INTERVAL:
            await hackernews.scrape(mood_state)
            elapsed["hn"] = 0

        if elapsed["mastodon"] >= MASTODON_INTERVAL:
            await mastodon.scrape(mood_state)
            elapsed["mastodon"] = 0

        if elapsed["news"] >= NEWS_INTERVAL:
            await newsapi.scrape(mood_state)
            elapsed["news"] = 0

        if elapsed["reddit"] >= REDDIT_INTERVAL:
            await reddit.scrape(mood_state)
            elapsed["reddit"] = 0


def _start_scrapers():
    global _scraper_task
    if _scraper_task and not _scraper_task.done():
        return
    _scraper_task = asyncio.create_task(_run_scrapers())
    logger.info("Mode: LIVE (scrapers started)")


async def _stop_scrapers():
    global _scraper_task
    if _scraper_task and not _scraper_task.done():
        task = _scraper_task
        _scraper_task = None
        task.cancel()
        # An in-flight threaded PRAW fetch can't be interrupted — don't let it
        # hold up the /api/mode response for more than a few seconds
        with contextlib.suppress(asyncio.CancelledError, asyncio.TimeoutError):
            await asyncio.wait_for(task, timeout=10)
        mood_state.real_scores.clear()
        logger.info("Mode: DEMO (scrapers stopped, real_scores cleared)")


@asynccontextmanager
async def lifespan(app: FastAPI):
    tasks = [
        asyncio.create_task(generator.run_continuous()),
        asyncio.create_task(_broadcast_loop()),
    ]
    if not _demo_mode:
        _start_scrapers()
    logger.info("Mode: %s", "DEMO" if _demo_mode else "LIVE")

    yield

    for t in tasks:
        t.cancel()
    await _stop_scrapers()


async def _broadcast_loop():
    while True:
        try:
            if manager._connections:
                snapshot = mood_state.live_update()
                snapshot["demo_mode"] = _demo_mode
                await manager.broadcast(snapshot)
        except Exception as e:
            logger.warning("Broadcast error: %s", e)
        await asyncio.sleep(2)


app = FastAPI(title="Internet Mood Tracker API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.mood_state = mood_state
app.include_router(router, prefix="/api")


@app.get("/api/mode")
async def get_mode():
    return {"demo": _demo_mode}


_mode_lock = asyncio.Lock()


@app.post("/api/mode")
async def set_mode(body: dict):
    global _demo_mode
    new_demo = bool(body.get("demo", True))
    async with _mode_lock:
        if new_demo == _demo_mode:
            return {"demo": _demo_mode, "changed": False}
        _demo_mode = new_demo
        mood_state.demo_mode = new_demo
        if _demo_mode:
            await _stop_scrapers()
        else:
            _start_scrapers()
    return {"demo": _demo_mode, "changed": True}


@app.websocket("/ws/feed")
async def websocket_feed(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        snapshot = mood_state.live_update()
        snapshot["demo_mode"] = _demo_mode
        await websocket.send_json(snapshot)
        while True:
            await asyncio.sleep(30)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
