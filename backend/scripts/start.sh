#!/bin/bash

# Exit on error
set -e

if [ "$MODE" = "worker" ]; then
    echo "Starting Celery Worker..."
    exec celery -A celery_app worker --loglevel=info
elif [ "$MODE" = "hybrid" ]; then
    echo "Starting Hybrid Mode (API + Worker)..."
    # Start Celery in the background
    celery -A celery_app worker --loglevel=info &
    # Start FastAPI in the foreground
    exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
else
    echo "Starting FastAPI Server..."
    exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
fi
