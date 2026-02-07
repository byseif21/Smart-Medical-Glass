import ssl
from celery import Celery
from utils.config import Config

# Initialize Celery app
celery_app = Celery(
    "medlens",
    broker=Config.REDIS_URL,
    backend=Config.REDIS_URL,
    include=["services.tasks"]
)

# Optional configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Task time limit to prevent hung processes
    task_time_limit=30,
    # SSL settings for Redis (Upstash)
    broker_use_ssl={
        'ssl_cert_reqs': ssl.CERT_NONE
    },
    redis_backend_use_ssl={
        'ssl_cert_reqs': ssl.CERT_NONE
    },
    # Fix for BrokenPipeError in some environments (e.g. Docker/Railway)
    worker_pool = 'solo'
)

if __name__ == "__main__":
    celery_app.start()
