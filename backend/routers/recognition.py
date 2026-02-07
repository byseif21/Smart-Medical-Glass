from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.concurrency import run_in_threadpool
# import base64
import logging
from services.user_service import get_complete_user_profile
from utils.config import get_config
from utils.image_processor import ImageProcessor, ImageProcessingError
from services.face_service import get_face_service #, FaceRecognitionError
from dependencies import get_current_user
# from services.tasks import recognize_face_task #NOTE: This requires the worker to be running to actually process

router = APIRouter(prefix="/api", tags=["recognition"])
settings = get_config()
logger = logging.getLogger(__name__)

@router.post("/recognize")
async def recognize_face(image: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """
    Recognize a person from their face image.
    Uses background worker (Celery) with local fallback for reliability.
    """
    try:
        image_bytes = await image.read()
        
        # 1. Fail Fast: Synchronous validation
        try:
            ImageProcessor.validate_image_format(image_bytes)
            ImageProcessor.validate_image_size(image_bytes)
  
        except ImageProcessingError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        # 2. Direct Execution (Synchronous) - TEMPORARY FIX
        # We skip the Async Worker (Celery/Redis) to match Login page performance
        # and avoid overhead/timeouts for small scale (5-10 users).
        
        # NOTE: To re-enable Celery/Redis for high-scale production:
        # 1. Comment out the "Direct Execution" block below.
        # 2. Uncomment the "Async Worker" block at the bottom.
        
        def local_recognize():
            face_service = get_face_service()
            return face_service.identify_user(image_bytes)
        
        match_result = await run_in_threadpool(local_recognize)
        
        task_result = {
            "success": True,
            "match": match_result.matched,
            "user_id": match_result.user_id,
            "confidence": match_result.confidence or 0.0
        }

        # --- ASYNC WORKER BLOCK (DISABLED FOR NOW) ---
        # # OPTIMIZATION: Resize image BEFORE sending to Redis.
        # optimized_bytes = await run_in_threadpool(ImageProcessor.optimize_for_network, image_bytes)
        # 
        # image_b64 = base64.b64encode(optimized_bytes).decode('utf-8')
        # task = recognize_face_task.delay(image_b64)
        # 
        # try:
        #     # Wait 25s for worker
        #     task_result = await run_in_threadpool(task.get, timeout=25)
        # except Exception as e:
        #     # Fallback logic here...
        #     task.revoke(terminate=True)
        #     logger.warning(f"Worker failed ({e}). Using local fallback.")
        #     ... (fallback code) ...
        # ---------------------------------------------

        # Process Result
        if not task_result.get("success"):
            raise HTTPException(status_code=400, detail=f"Recognition failed: {task_result.get('error', 'Unknown error')}")

        if not task_result.get("match"):
            return {
                "success": True,
                "match": False,
                "message": "Face not recognized",
                "confidence": task_result.get("confidence", 0.0)
            }
            
        # Fetch Full Profile
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
