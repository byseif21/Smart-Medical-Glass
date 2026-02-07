import base64
import logging
from typing import Dict, Any
from celery import shared_task
from services.face_service import get_face_service

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def recognize_face_task(self, image_bytes_b64: str, current_user_sub: str = None, role: str = "user") -> Dict[str, Any]:
    """
    Background task to recognize a face from an image.
    
    Args:
        image_bytes_b64: Base64 encoded image bytes (JSON serializable)
        current_user_sub: ID of the user making the request
        role: Role of the user making the request
        
    Returns:
        Dict containing recognition results
    """
    try:
        # Decode image bytes
        image_bytes = base64.b64decode(image_bytes_b64)
        
        # Get service instance
        face_service = get_face_service()
        
        # Identify user
        match_result = face_service.identify_user(image_bytes)
        
        if not match_result.matched or not match_result.user_id:
            return {
                "success": True,
                "match": False,
                "message": "Face not recognized",
                "confidence": match_result.confidence or 0.0
            }

        # Return only essential match data to keep the worker task lightweight.
        # The API handler will fetch the full profile asynchronously.
        return {
            "success": True,
            "match": True,
            "user_id": match_result.user_id,
            "confidence": match_result.confidence
        }
        
    except Exception as e:
        logger.error(f"Task failed: {e}")
        return {
            "success": False,
            "error": str(e)
        }
