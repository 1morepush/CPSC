import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .state import InternetMoodState
from .mock_generator import MoodDataGenerator
from .api.routes import router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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


@asynccontextmanager
async def lifespan(app: FastAPI):
    gen_task = asyncio.create_task(generator.run_continuous())
    broadcast_task = asyncio.create_task(_broadcast_loop())
    yield
    gen_task.cancel()
    broadcast_task.cancel()


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
        # Send initial snapshot immediately
        await websocket.send_json(mood_state.live_update())
        while True:
            # Keep alive — actual data is pushed from broadcast_loop
            await asyncio.sleep(30)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
