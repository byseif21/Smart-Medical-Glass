from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.concurrency import run_in_threadpool
import base64
import logging
from services.user_service import get_complete_user_profile
from utils.config import get_config
from dependencies import get_current_user
from services.tasks import recognize_face_task #NOTE: This requires the worker to be running to actually process

router = APIRouter(prefix="/api", tags=["recognition"])
settings = get_config()
logger = logging.getLogger(__name__)

@router.post("/recognize")
async def recognize_face(image: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """
    Recognize a person from their face image.
    Uses background worker (Celery) for image processing to improve throughput.
    Returns complete profile if match found.
    """
    try:
        # Read image bytes
        image_bytes = await image.read()
        
        # Encode to base64 for transport to Celery
        image_b64 = base64.b64encode(image_bytes).decode('utf-8')
        
        # Dispatch to Celery worker
        task = recognize_face_task.delay(image_b64)
        
        # Wait for result (timeout after 25 seconds)
        try:
            task_result = await run_in_threadpool(task.get, timeout=25)
        except Exception as e:
            # if timeout or other error, revoke task and raise error
            task.revoke(terminate=True)
            logger.error(f"Recognition task timed out or failed: {e}")
            raise HTTPException(status_code=504, detail="Recognition request timed out")

        # Check result
        if not task_result.get("success"):
            error_msg = task_result.get("error", "Unknown error")
            raise HTTPException(status_code=400, detail=f"Recognition failed: {error_msg}")

        # Not matched?
        if not task_result.get("match"):
            return {
                "success": True,
                "match": False,
                "message": "Face not recognized",
                "confidence": task_result.get("confidence", 0.0)
            }
            
        # Matche? fetch full profile
        #NOTE we do this in the API handler (async) rather than the synchronous Celery worker
        matched_user_id = task_result.get("user_id")
        current_user_id = (current_user or {}).get("sub")
        role = (current_user or {}).get("role") or "user"
        
        profile = await get_complete_user_profile(matched_user_id, current_user_id, role)
        
        return {
            "success": True,
            "match": True,
            "confidence": task_result.get("confidence"),
            **profile
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in recognize_face: {e}")
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")
