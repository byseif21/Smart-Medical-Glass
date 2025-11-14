"""
Recognition router for Smart Glass AI system.
Handles face recognition from uploaded images.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, status

from ..models.user import (
    RecognitionResponse,
    ErrorResponse,
    UserResponse
)
from ..services.face_service import get_face_service, FaceRecognitionError
from ..services.storage_service import get_supabase_service, SupabaseError
from ..utils.image_processor import ImageProcessor


router = APIRouter(
    prefix="/api",
    tags=["recognition"]
)


@router.post(
    "/recognize",
    response_model=RecognitionResponse,
    status_code=status.HTTP_200_OK,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request - invalid input or face detection error"},
        503: {"model": ErrorResponse, "description": "Service unavailable - database connection error"}
    }
)
async def recognize_face(
    image: UploadFile = File(..., description="Face image file (JPEG or PNG)")
):
    """
    Recognize a face from an uploaded image.
    
    This endpoint:
    1. Validates the uploaded image
    2. Extracts face encoding from the image
    3. Loads encodings from local JSON cache
    4. Finds matching face using face matching logic
    5. Retrieves full user data from Supabase if match found
    6. Returns recognition result with user data and confidence score
    
    Requirements: 5.1, 5.2
    """
    # Initialize services
    face_service = get_face_service()
    storage_service = get_supabase_service()
    
    try:
        # Validate image file
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "error": {
                        "code": "INVALID_FILE_TYPE",
                        "message": "File must be an image (JPEG or PNG)",
                        "details": {"content_type": image.content_type}
                    }
                }
            )
        
        # Read image bytes
        image_bytes = await image.read()
        
        # Validate image size
        if not ImageProcessor.validate_image_size(image_bytes):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "error": {
                        "code": "IMAGE_TOO_LARGE",
                        "message": f"Image size exceeds maximum allowed size",
                        "details": {}
                    }
                }
            )
        
        # Extract face encoding from image
        extraction_result = face_service.extract_encoding(image_bytes)
        
        if not extraction_result.success:
            # Determine error code based on error message
            if "No face detected" in extraction_result.error:
                error_code = "NO_FACE_DETECTED"
            elif "Multiple faces" in extraction_result.error:
                error_code = "MULTIPLE_FACES_DETECTED"
            else:
                error_code = "FACE_EXTRACTION_FAILED"
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "error": {
                        "code": error_code,
                        "message": extraction_result.error,
                        "details": {"face_count": extraction_result.face_count}
                    }
                }
            )
        
        # At this point, we have a valid face encoding
        encoding = extraction_result.encoding
        
        # Find matching face using face matching logic
        match_result = face_service.find_match(encoding)
        
        if not match_result.matched:
            # No match found
            return RecognitionResponse(
                recognized=False,
                user=None,
                confidence=None,
                message="No matching face found"
            )
        
        # Match found - retrieve full user data from Supabase
        try:
            user_data = storage_service.get_user(match_result.user_id)
            
            if user_data is None:
                # User not found in database (data inconsistency)
                return RecognitionResponse(
                    recognized=False,
                    user=None,
                    confidence=None,
                    message="Face matched but user data not found in database"
                )
            
            return RecognitionResponse(
                recognized=True,
                user=user_data,
                confidence=match_result.confidence,
                message=None
            )
            
        except SupabaseError as e:
            # Failed to retrieve user data from database
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "success": False,
                    "error": {
                        "code": "DATABASE_ERROR",
                        "message": "Failed to retrieve user data from database",
                        "details": {"error": str(e)}
                    }
                }
            )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except FaceRecognitionError as e:
        # Handle face recognition service errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "FACE_RECOGNITION_ERROR",
                    "message": str(e),
                    "details": {}
                }
            }
        )
    except Exception as e:
        # Catch any unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred during recognition",
                    "details": {"error": str(e)}
                }
            }
        )
