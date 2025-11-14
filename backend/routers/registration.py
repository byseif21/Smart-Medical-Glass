"""
Registration router for Smart Glass AI system.
Handles user registration with face image upload.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from typing import Optional

from ..models.user import (
    UserCreate,
    RegistrationResponse,
    ErrorResponse
)
from ..services.face_service import get_face_service, FaceRecognitionError
from ..services.storage_service import get_supabase_service, SupabaseError
from ..utils.image_processor import ImageProcessor, ImageProcessingError


router = APIRouter(
    prefix="/api",
    tags=["registration"]
)


@router.post(
    "/register",
    response_model=RegistrationResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request - invalid input or face detection error"},
        409: {"model": ErrorResponse, "description": "Conflict - user already exists"},
        503: {"model": ErrorResponse, "description": "Service unavailable - database connection error"}
    }
)
async def register_user(
    image: UploadFile = File(..., description="Face image file (JPEG or PNG)"),
    name: str = Form(..., min_length=1, max_length=255, description="User's full name"),
    email: str = Form(..., description="User's email address"),
    phone: Optional[str] = Form(None, max_length=50, description="User's phone number (optional)")
):
    """
    Register a new user with face image and personal information.
    
    This endpoint:
    1. Validates the uploaded image
    2. Extracts face encoding from the image
    3. Saves encoding to local JSON storage
    4. Uploads image to Supabase Storage
    5. Saves user data and encoding to Supabase database
    
    Requirements: 4.1, 4.2
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
        
        # Create user data model for validation
        user_data = UserCreate(
            name=name,
            email=email,
            phone=phone
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
        
        # Upload image to Supabase Storage first (before creating user record)
        # Determine file extension from content type
        file_extension = "jpg"
        if image.content_type == "image/png":
            file_extension = "png"
        
        # We'll use a temporary ID for the image upload, then update after user creation
        # For now, let's save the user first to get the user_id
        
        # Save user data to Supabase (this will fail if user already exists)
        try:
            user_response = storage_service.save_user(user_data, image_url=None)
            user_id = user_response.id
        except SupabaseError as e:
            if "already exists" in str(e):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "success": False,
                        "error": {
                            "code": "USER_ALREADY_EXISTS",
                            "message": f"User with email {email} is already registered",
                            "details": {}
                        }
                    }
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail={
                        "success": False,
                        "error": {
                            "code": "DATABASE_ERROR",
                            "message": "Failed to save user data to database",
                            "details": {"error": str(e)}
                        }
                    }
                )
        
        # Now upload image with the actual user_id
        try:
            image_url = storage_service.upload_image(image_bytes, user_id, file_extension)
        except SupabaseError as e:
            # Image upload failed, but user is created - log warning but continue
            print(f"Warning: Failed to upload image for user {user_id}: {str(e)}")
            image_url = None
        
        # Save face encoding to local JSON storage
        try:
            face_service.save_encoding(
                user_id=user_id,
                encoding=encoding,
                user_data={"name": name, "email": email}
            )
        except FaceRecognitionError as e:
            # Local storage failed - log error but continue since data is in Supabase
            print(f"Warning: Failed to save encoding to local storage for user {user_id}: {str(e)}")
        
        # Save face encoding to Supabase
        try:
            storage_service.save_face_encoding(user_id, encoding)
        except SupabaseError as e:
            # Encoding save failed - log warning but continue
            print(f"Warning: Failed to save encoding to Supabase for user {user_id}: {str(e)}")
        
        # Return success response
        return RegistrationResponse(
            success=True,
            user_id=user_id,
            message="User registered successfully"
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Catch any unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred during registration",
                    "details": {"error": str(e)}
                }
            }
        )
