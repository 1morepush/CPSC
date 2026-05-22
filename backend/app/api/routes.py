from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/snapshot")
async def get_snapshot(request: Request):
    state = request.app.state.mood_state
    return state.snapshot()


@router.get("/mood/current")
async def get_current_mood(request: Request):
    return request.app.state.mood_state.global_mood


@router.get("/mood/history")
async def get_mood_history(request: Request):
    return list(request.app.state.mood_state.history)


@router.get("/communities")
async def get_communities(request: Request):
    return request.app.state.mood_state.communities


@router.get("/trends")
async def get_trends(request: Request):
    return request.app.state.mood_state.trends


@router.get("/insights")
async def get_insights(request: Request):
    return list(request.app.state.mood_state.insights)


@router.get("/feed")
async def get_feed(request: Request, limit: int = 30):
    posts = list(request.app.state.mood_state.post_window)
    return posts[-limit:]


@router.get("/network")
async def get_network(request: Request):
    s = request.app.state.mood_state
    return {"nodes": s.network_nodes, "edges": s.network_edges}


@router.get("/health")
async def health():
    return {"status": "ok"}
