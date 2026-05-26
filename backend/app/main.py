import asyncio
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .state import InternetMoodState
from .mock_generator import MoodDataGenerator
from .api.routes import router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

USE_DEMO_MODE = os.getenv("USE_DEMO_MODE", "true").lower() != "false"

mood_state = InternetMoodState()
generator = MoodDataGenerator(mood_state)


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
    """Runs all scrapers on a fixed schedule when USE_DEMO_MODE=false."""
    from .scrapers import hackernews, newsapi

    logger.info("Real-data mode: scrapers starting")
    # Stagger initial runs so they don't all fire at once
    await asyncio.sleep(5)
    await hackernews.scrape(mood_state)
    await asyncio.sleep(3)
    await newsapi.scrape(mood_state)

    HN_INTERVAL = 5 * 60      # every 5 minutes
    NEWS_INTERVAL = 10 * 60   # every 10 minutes (free tier: 100 req/day)
    hn_elapsed = 0
    news_elapsed = 0
    tick = 30

    while True:
        await asyncio.sleep(tick)
        hn_elapsed += tick
        news_elapsed += tick

        if hn_elapsed >= HN_INTERVAL:
            await hackernews.scrape(mood_state)
            hn_elapsed = 0

        if news_elapsed >= NEWS_INTERVAL:
            await newsapi.scrape(mood_state)
            news_elapsed = 0


@asynccontextmanager
async def lifespan(app: FastAPI):
    tasks = [
        asyncio.create_task(generator.run_continuous()),
        asyncio.create_task(_broadcast_loop()),
    ]
    if not USE_DEMO_MODE:
        tasks.append(asyncio.create_task(_run_scrapers()))
        logger.info("Mode: LIVE (real data scrapers enabled)")
    else:
        logger.info("Mode: DEMO (simulated data only)")

    yield

    for t in tasks:
        t.cancel()


async def _broadcast_loop():
    while True:
        try:
            if manager._connections:
                await manager.broadcast(mood_state.live_update())
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


@app.websocket("/ws/feed")
async def websocket_feed(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await websocket.send_json(mood_state.live_update())
        while True:
            await asyncio.sleep(30)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
