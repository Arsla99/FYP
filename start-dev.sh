#!/bin/bash
# Start both Next.js (port 3000) and emotion API (port 8001) together.
# Press Ctrl+C once to stop both.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOS_DIR="$SCRIPT_DIR/SOS-main"
EMOTION_DIR="$SCRIPT_DIR/emotion-api"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 Starting SOS dev environment"
echo "  Next.js  → http://localhost:3000"
echo "  Emotion  → http://localhost:8001"
echo "  Press Ctrl+C to stop both"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cleanup() {
  echo ""
  echo "Stopping servers..."
  kill "$NEXTJS_PID" "$EMOTION_PID" 2>/dev/null
  wait 2>/dev/null
  echo "Done."
}
trap cleanup INT TERM

# ── Emotion API (port 8001) ──────────────────────────────────────────
cd "$EMOTION_DIR"
export PATH="$HOME/.local/bin:$PATH"
# Pass GEMINI_API_KEY if set in environment
PORT=8001 GEMINI_API_KEY="${GEMINI_API_KEY:-}" python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload &
EMOTION_PID=$!
echo "✅ Emotion API started (PID $EMOTION_PID)"

sleep 2

# ── Next.js (port 3000) ──────────────────────────────────────────────
cd "$SOS_DIR"
# Override the emotion API URL to use local server
export NEXT_PUBLIC_EMOTION_API_URL=http://localhost:8001
# Clear stale build artifacts that can cause missing chunk/module errors in dev.
rm -rf .next
npm run dev &
NEXTJS_PID=$!
echo "✅ Next.js started (PID $NEXTJS_PID)"

wait
