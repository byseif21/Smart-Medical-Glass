from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from utils.config import get_config
from routers import registration, recognition

# Initialize FastAPI app
app = FastAPI(
    title="Smart Glass AI API",
    description="Face recognition API for Smart Glass AI system",
    version="1.0.0"
)

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

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Smart Glass AI API is running"}

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "face_recognition": "operational",
            "supabase": "connected"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
