#!/bin/sh
set -e
PORT="${PORT:-8000}"

# buffalo_l uses ~300MB per process. Render free tier is 512MB — never run 2 workers.
if [ "${USE_GUNICORN:-}" = "1" ]; then
  WORKERS="${GUNICORN_WORKERS:-1}"
  exec gunicorn main:app \
    -w "$WORKERS" \
    -k uvicorn.workers.UvicornWorker \
    --bind "0.0.0.0:${PORT}" \
    --timeout 60
fi

exec uvicorn main:app --host 0.0.0.0 --port "$PORT"
