from typing import List, Dict, Any, Optional, Tuple
import json
from fastapi import UploadFile, HTTPException
from services.storage_service import get_supabase_service
from services.face_service import get_face_service, FaceRecognitionError
from utils.security import hash_password, verify_password
from services.profile_picture_service import get_profile_picture_url, ProfilePictureError
from utils.validation import validate_password, ValidationError
from services.connection_service import ConnectionService
from models.user import RegistrationRequest, UserCreate
import logging

logger = logging.getLogger(__name__)

async def register_new_user(
    request: RegistrationRequest,
    face_images_dict: Dict[str, UploadFile]
) -> Dict[str, Any]:
    """
    Register a new user with validation, face processing, and database creation.
    """
    logger.info(f"Starting registration for user: {request.email}")
    supabase = get_supabase_service()
    face_service = get_face_service()
    
    try:
        # 1. Validate Input & Check Existence
        logger.info("Validating registration input...")
        _validate_registration(supabase, request)
        
        # 2. Process Face Data (Encoding & Duplication Check)
        logger.info("Processing face data...")
        avg_encoding, face_images = await _process_face_data(face_service, face_images_dict)
        logger.info(f"Face data processed. Avg encoding length: {len(avg_encoding)}")
        
        # 3. Create User & Upload Images
        logger.info("Persisting user registration...")
        face_data = (avg_encoding, face_images)
        result = _persist_user_registration(supabase, request, face_data)
        logger.info(f"User registration completed successfully for: {request.email}")
        return result
        
    except HTTPException as e:
        logger.warning(f"Registration failed (HTTP {e.status_code}): {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during registration for {request.email}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

def _validate_registration(supabase, request: RegistrationRequest):
    """Validate password and check if user email already exists."""
    try:
        validate_password(request.password)
    except ValidationError as e:
        logger.warning(f"Password validation failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    # Check existence using storage service
    existing = supabase.get_user_by_email(request.email)
    if existing:
        logger.warning(f"User already exists: {request.email}")
        raise HTTPException(status_code=409, detail="User with this email already exists")

async def _process_face_data(
    face_service, 
    face_images_dict: Dict[str, UploadFile]
) -> Tuple[List[float], Dict[str, bytes]]:
    """Collect images, generate encoding, and check for face duplicates."""
    try:
        face_images = await face_service.collect_face_images(face_images_dict)
        
        if not face_images:
            raise HTTPException(status_code=400, detail="At least one face image is required")
        
        avg_encoding = face_service.process_face_images(face_images)
        
        match_result = face_service.find_match(avg_encoding)
        if match_result.matched:
            logger.warning(f"Face duplicate detected. Matches user: {match_result.user_id}")
            raise HTTPException(
                status_code=409, 
                detail="This face is already registered to another user."
            )
        return avg_encoding, face_images
        
    except FaceRecognitionError as e:
        logger.error(f"Face recognition error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error processing face data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Face processing failed: {str(e)}")

def _persist_user_registration(
    supabase, 
    request: RegistrationRequest, 
    face_data: Tuple[List[float], Dict[str, bytes]]
) -> Dict[str, Any]:
    """Create user record and upload face images."""
    avg_encoding, face_images = face_data
    try:
        password_hash = hash_password(request.password)
        face_encoding_json = json.dumps(avg_encoding)
        
        # Prepare data for storage service
        user_create = UserCreate(
            name=request.name,
            email=request.email,
            phone=request.phone
        )
        
        # Use storage service to save user
        try:
            user_response = supabase.save_user(
                user_data=user_create,
                password_hash=password_hash,
                date_of_birth=request.date_of_birth,
                gender=request.gender,
                nationality=request.nationality,
                id_number=request.id_number,
                face_encoding=face_encoding_json
            )
        except Exception as e:
            logger.error(f"Database save failed: {e}")
            # Re-raise as HTTPException to match previous behavior
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
            
        user_id = user_response.id

        try:
            face_service = get_face_service() # Ensure we get the service
            face_service.upload_face_images(supabase, user_id, face_images)
        except Exception as e:
            logger.error(f"Image upload failed for user {user_id}: {e}")
            rollback_error_msg: Optional[str] = None
            try:
                delete_user_fully(str(user_id))
            except Exception as rollback_error:
                rollback_error_msg = (
                    f"Rollback failed when deleting user {user_id}: {rollback_error}"
                )
                logger.critical(rollback_error_msg)
            
            error_detail = f"Failed to upload face images: {str(e)}"
            if rollback_error_msg is not None:
                error_detail += f". Additionally, cleanup failed: {rollback_error_msg}"
                
            raise HTTPException(
                status_code=500,
                detail=error_detail
            )

        # Return dictionary representation of the created user
        return user_response.model_dump()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Persist registration failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

def delete_user_fully(user_id: str) -> bool:
    """
    Completely delete a user and all their associated data:
    1. Local face encodings
    2. Supabase Storage images (avatar, face angles)
    3. Database record (cascades to related tables)
    
    Args:
        user_id: The UUID of the user to delete
        
    Returns:
        bool: True if deletion was initiated/completed successfully
    """
    supabase = get_supabase_service()
    face_service = get_face_service()
    
    # 1. Delete face encoding from local file
    try:
        face_service.delete_encoding(user_id)
    except Exception as e:
        print(f"Warning: Failed to delete face encoding for user {user_id}: {e}")
    
    # 2. Delete images from Supabase Storage
    # We try to delete all potential image files
    potential_files = [
        f"{user_id}/avatar.jpg",
        f"{user_id}/front.jpg",
        f"{user_id}/left.jpg",
        f"{user_id}/right.jpg",
        f"{user_id}/up.jpg",
        f"{user_id}/down.jpg"
    ]
    try:
        supabase.client.storage.from_('face-images').remove(potential_files)
    except Exception as e:
        print(f"Warning: Failed to cleanup storage for user {user_id}: {str(e)}")
        # Continue execution, as account deletion is the priority
        
    # 3. Delete user from database
    # This will cascade delete related records (medical_info, relatives, etc.)
    try:
        supabase.delete_user(user_id)
        return True
    except Exception as e:
        raise Exception(f"Database deletion failed: {str(e)}")


async def get_complete_user_profile(
    user_id: str,
    current_user_id: Optional[str],
    role: str,
    connection_service: Optional[ConnectionService] = None
) -> Dict[str, Any]:
    """
    Get complete user profile including medical info, relatives, and profile picture URL.
    Applies privacy settings based on viewer's role and identity.
    """
    supabase = get_supabase_service()
    
    # Get user basic info
    user = supabase.get_full_user_profile(user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get profile picture URL
    profile_picture_url = None
    try:
        profile_picture_url = get_profile_picture_url(user_id, supabase)
    except ProfilePictureError as e:
        print(f"Warning: Failed to retrieve profile picture for user {user_id}: {str(e)}")
    
    user['profile_picture_url'] = profile_picture_url
    
    is_self = current_user_id == user_id
    can_view_full = is_self or role in ["doctor", "admin"]

    if can_view_full:
        response_payload = {
            **user,
            "profile_picture_url": profile_picture_url
        }
        medical_response = supabase.client.table('medical_info').select('*').eq('user_id', user_id).execute()
        medical_info = medical_response.data[0] if medical_response.data else {}
        
        # Use ConnectionService for contacts
        if connection_service is None:
            connection_service = ConnectionService()
        emergency_contacts = connection_service.get_emergency_contacts(user_id)

        response_payload["medical_info"] = medical_info
        response_payload["emergency_contacts"] = emergency_contacts
    else:
        response_payload = apply_privacy_settings(user, role)

    return response_payload

async def update_user_privacy(user_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
    """Update user's privacy settings."""
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided for update")
    
    supabase = get_supabase_service()
    updated_user = supabase.update_user(user_id, update_data)
    
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return updated_user

async def update_user_main_info(user_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
    """Update user's main information."""
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided for update")
    
    supabase = get_supabase_service()
    updated_user = supabase.update_user(user_id, update_data)
    
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return updated_user

async def update_user_medical_info(user_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
    """Update or insert user's medical information."""
    if len(update_data) <= 1:  # Only user_id or empty
        raise HTTPException(status_code=400, detail="No data provided for update")
    
    supabase = get_supabase_service()
    existing = supabase.client.table('medical_info').select('id').eq('user_id', user_id).execute()
    
    if existing.data:
        response = supabase.client.table('medical_info').update(update_data).eq('user_id', user_id).execute()
    else:
        response = supabase.client.table('medical_info').insert(update_data).execute()
    
    return response.data[0] if response.data else {}

async def update_user_relatives(user_id: str, relatives_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Update user's relatives by replacing existing ones."""
    supabase = get_supabase_service()
    
    # Delete existing relatives
    supabase.client.table('relatives').delete().eq('user_id', user_id).execute()
    
    # Insert new relatives
    if relatives_data:
        response = supabase.client.table('relatives').insert(relatives_data).execute()
        return response.data
    
    return []

async def update_user_face_enrollment(
    user_id: str,
    password: str,
    face_images: Dict[str, bytes]
) -> None:
    """Update user's face enrollment with password verification."""
    supabase = get_supabase_service()
    face_service = get_face_service()

    # Get current user data including password hash
    user_hash = supabase.get_user_password_hash(user_id)
    if not user_hash:
        raise HTTPException(status_code=404, detail="User not found")
    
    stored_hash = user_hash

    # Verify password
    if not stored_hash or not verify_password(password, stored_hash):
        raise HTTPException(status_code=403, detail="Invalid password")
    
    # Delegate enrollment to service
    try:
        await face_service.enroll_user(user_id, face_images, supabase)
    except FaceRecognitionError as e:
        raise HTTPException(status_code=400, detail=str(e))

async def verify_and_delete_account(user_id: str, password: str) -> None:
    """Verify password and delete account."""
    supabase = get_supabase_service()
    
    # Get current user to verify password
    password_hash = supabase.get_user_password_hash(user_id)
    
    if not password_hash:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify password
    if not verify_password(password, password_hash):
        raise HTTPException(status_code=400, detail="Invalid password")
        
    delete_user_fully(user_id)

def apply_privacy_settings(user: Dict[str, Any], current_user_role: str = "user") -> Dict[str, Any]:
    """
    Apply privacy settings to user data based on the viewer's role.
    """
    is_privileged = current_user_role in ["doctor", "admin"]
    
    # Check if account is public (name visibility controls profile visibility)
    # Default to True for legacy users
    is_name_public = user.get('is_name_public', True)
    can_view_basic = is_privileged or is_name_public

    if not can_view_basic:
        return {
            "id": user.get('id'),
            "user_id": user.get('id'),
            "name": "Private Account",
            "profile_picture_url": None,
            "date_of_birth": None,
            "gender": None,
            "nationality": None,
            "id_number": None,
            "phone": None,
            "email": None,
        }

    # Helper to check individual field visibility
    def can_view(field_key: str, default_public: bool = False) -> bool:
        if is_privileged:
            return True
        return user.get(field_key, default_public)

    return {
        "id": user.get('id'),
        "user_id": user.get('id'),
        "name": user.get('name'),
        "profile_picture_url": user.get('profile_picture_url'),
        
        "date_of_birth": user.get('date_of_birth') if can_view('is_dob_public') else None,
        "gender": user.get('gender') if can_view('is_gender_public', True) else None,
        "nationality": user.get('nationality') if can_view('is_nationality_public') else None,
        "id_number": user.get('id_number') if can_view('is_id_number_public') else None,
        "phone": user.get('phone') if can_view('is_phone_public') else None,
        "email": user.get('email') if can_view('is_email_public') else None,
    }
