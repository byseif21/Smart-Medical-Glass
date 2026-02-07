from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from utils.config import get_config
from routers import registration, recognition, auth, profile, users, connections, admin
import logging
# Import celery_app to ensure it's initialized and configured with the correct Broker URL
from celery_app import celery_app  # noqa

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="MedLens API",
    description="Face recognition API for MedLens system",
    version="1.0.0"
)

# Trust Proxy Headers (for SSL termination)
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

# Get configuration settings
settings = get_config()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(registration.router)
app.include_router(recognition.router)
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(users.router)
app.include_router(connections.router)
app.include_router(admin.router)

# Run migrations on startup
@app.on_event("startup")
async def startup_event():
    """Run database migrations and other startup tasks."""
    logger.info("Starting MedLens API...")
    
    # Log Redis connection info (masked)
    redis_url = settings.REDIS_URL
    masked_url = redis_url.split("@")[-1] if "@" in redis_url else "localhost/local"
    logger.info(f"Configured Redis Broker: ...@{masked_url}")
    
    # Check and run database migrations
    try:
        from services.storage_service import get_supabase_service
        from utils.migrations import run_migrations_on_startup
        
        supabase_service = get_supabase_service()
        run_migrations_on_startup(supabase_service.client)
    except Exception as e:
        logger.error(f"Startup error: {e}")
    
    logger.info("MedLens API started successfully")

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "MedLens API is running"}

@app.get("/api/health")
@app.head("/api/health")
async def health_check():
    """
    Health check endpoint that verifies the status of all system services.
    
    Returns:
        Dictionary with overall status and individual service statuses
    """
    from services.face_service import get_face_service
    from services.storage_service import get_supabase_service
    
    health_status = {
        "status": "healthy",
        "timestamp": None,
        "services": {
            "face_recognition": {
                "status": "unknown",
                "details": {}
            },
            "supabase": {
                "status": "unknown",
                "details": {}
            }
        }
    }
    
    # Check face recognition service
    try:
        face_service = get_face_service()
        encoding_count = face_service.get_encoding_count()
        health_status["services"]["face_recognition"] = {
            "status": "operational",
            "details": {
                "encodings_stored": encoding_count,
                "tolerance": face_service.tolerance
            }
        }
    except Exception as e:
        health_status["services"]["face_recognition"] = {
            "status": "error",
            "details": {
                "error": str(e)
            }
        }
        health_status["status"] = "degraded"
    
    # Check Supabase connection
    try:
        supabase_service = get_supabase_service()
        supabase_health = supabase_service.get_health_status()
        health_status["services"]["supabase"] = {
            "status": supabase_health["status"],
            "details": {
                "connected": supabase_health["connected"],
                "url": supabase_health["url"]
            }
        }
        
        if not supabase_health["connected"]:
            health_status["status"] = "degraded"
            if "error" in supabase_health:
                health_status["services"]["supabase"]["details"]["error"] = supabase_health["error"]
    except Exception as e:
        health_status["services"]["supabase"] = {
            "status": "error",
            "details": {
                "error": str(e)
            }
        }
        health_status["status"] = "degraded"
    
    # Add timestamp
    from datetime import datetime
    health_status["timestamp"] = datetime.utcnow().isoformat()
    
    return health_status

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
