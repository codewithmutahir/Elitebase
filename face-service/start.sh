#!/bin/sh
set -e
PORT="${PORT:-8000}"

if [ "${USE_GUNICORN:-}" = "1" ]; then
  exec gunicorn main:app \
    -w 2 \
    -k uvicorn.workers.UvicornWorker \
    --bind "0.0.0.0:${PORT}" \
    --timeout 60
fi

exec uvicorn main:app --host 0.0.0.0 --port "$PORT"
