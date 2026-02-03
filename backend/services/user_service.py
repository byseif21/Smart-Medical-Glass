from typing import List, Dict, Any, Optional, Tuple
import json
from fastapi import UploadFile, HTTPException
from services.storage_service import get_supabase_service
from services.face_service import get_face_service, FaceRecognitionError, collect_face_images, upload_face_images
from services.security import hash_password
from utils.validation import normalize_email, sanitize_text, validate_password, validate_phone, ValidationError

from models.user import RegistrationRequest

async def register_new_user(
    request: RegistrationRequest,
    face_images_dict: Dict[str, UploadFile]
) -> Dict[str, Any]:
    """
    Register a new user with validation, face processing, and database creation.
    """
    supabase = get_supabase_service()
    face_service = get_face_service()
    
    # 1. Validate Input & Check Existence
    _validate_registration(supabase, request)
    
    # 2. Process Face Data (Encoding & Duplication Check)
    avg_encoding, face_images = await _process_face_data(face_service, face_images_dict)
    
    # 3. Create User & Upload Images
    face_data = (avg_encoding, face_images)
    return _persist_user_registration(supabase, request, face_data)

def _validate_registration(supabase, request: RegistrationRequest):
    """Validate password and check if user email already exists."""
    try:
        validate_password(request.password)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))

    existing = supabase.client.table('users').select('id').eq('email', request.email).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="User with this email already exists")

async def _process_face_data(
    face_service, 
    face_images_dict: Dict[str, UploadFile]
) -> Tuple[List[float], Dict[str, bytes]]:
    """Collect images, generate encoding, and check for face duplicates."""
    face_images = await collect_face_images(face_images_dict)
    
    if not face_images:
        raise HTTPException(status_code=400, detail="At least one face image is required")
    
    try:
        avg_encoding = face_service.process_face_images(face_images)
    except FaceRecognitionError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    match_result = face_service.find_match(avg_encoding)
    if match_result.matched:
        raise HTTPException(
            status_code=409, 
            detail="This face is already registered to another user."
        )
    return avg_encoding, face_images

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
        user_data = {
            "name": request.name,
            "email": request.email,
            "phone": request.phone,
            "password_hash": password_hash,
            "date_of_birth": request.date_of_birth,
            "gender": request.gender,
            "nationality": request.nationality,
            "id_number": request.id_number,
            "face_encoding": face_encoding_json
        }

        response = supabase.client.table('users').insert(user_data).execute()
        new_user = response.data[0]
        user_id = new_user['id']

        try:
             upload_face_images(supabase, user_id, face_images)
        except Exception as e:
             print(f"Error uploading images: {e}")

        return new_user

    except HTTPException:
        raise
    except Exception as e:
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
        delete_response = supabase.client.table('users').delete().eq('id', user_id).execute()
        # Note: Supabase delete might return empty data if successful but we can check if error occurred
        return True
    except Exception as e:
        raise Exception(f"Database deletion failed: {str(e)}")
