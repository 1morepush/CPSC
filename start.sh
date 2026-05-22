#!/bin/bash
set -e

ROOT=$(cd "$(dirname "$0")" && pwd)

echo "=== Internet Mood Tracker ==="

# Backend
echo "[1/2] Starting backend (FastAPI)..."
cd "$ROOT/backend"
if ! command -v uvicorn &>/dev/null; then
  pip install -r requirements.txt -q
fi
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Wait for backend
echo "  Waiting for backend..."
for i in {1..15}; do
  if curl -sf http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "  Backend ready ✓"
    break
  fi
  sleep 1
done

# Frontend
echo "[2/2] Starting frontend (Next.js)..."
cd "$ROOT/frontend"
if [ ! -d node_modules ]; then
  npm install
fi
npm run dev &
FRONTEND_PID=$!

echo ""
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "  Press Ctrl+C to stop."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
