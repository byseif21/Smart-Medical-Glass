from typing import List, Dict, Any, Optional
import re
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
    
    # Input Validation & Sanitization (Already partially handled by Pydantic, but explicit checks remain)
    try:
        # Re-validate critical logic if needed, but Pydantic handles basics.
        # Check password complexity explicitly if not in model
        validate_password(request.password)
        
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Check if user already exists
    existing = supabase.client.table('users').select('id').eq('email', request.email).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="User with this email already exists")
    
    # Hash password
    password_hash = hash_password(request.password)
    
    # Collect face images
    face_images = await collect_face_images(face_images_dict)
    
    if not face_images:
        raise HTTPException(status_code=400, detail="At least one face image is required")
    
    # Process face images to get average encoding
    try:
        avg_encoding = face_service.process_face_images(face_images)
    except FaceRecognitionError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Check for duplicate face registration
    match_result = face_service.find_match(avg_encoding)
    if match_result.matched:
            raise HTTPException(
                status_code=409, 
                detail="This face is already registered to another user."
            )
    
    # Create user in database
    try:
        new_user = await _create_user_entry(supabase, request, password_hash, avg_encoding, face_images)
        return new_user
    except Exception as e:
        # If user creation fails, we should ideally rollback, but Supabase atomic transactions 
        # via API are limited. For now, we propagate the error.
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

async def _create_user_entry(
    supabase, 
    request: RegistrationRequest, 
    password_hash: str, 
    face_encoding: List[float],
    face_images: Dict[str, bytes]
) -> Dict[str, Any]:
    """Helper to create user record and upload images."""
    face_encoding_json = json.dumps(face_encoding)
    
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
    
    # Upload face images
    try:
        upload_face_images(user_id, face_images)
    except Exception as e:
        print(f"Error uploading images: {e}")
        # Non-critical error, proceed
        
    return new_user

def get_users_paginated(
    page: int = 1,
    page_size: int = 20,
    query_str: Optional[str] = None,
    role_filter: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get paginated users list with optional search and role filter.
    Returns: { "users": [...], "total": int }
    """
    supabase = get_supabase_service()
    
    if query_str:
        return _get_search_results(supabase, query_str, role_filter, page, page_size)
    else:
        return _get_standard_results(supabase, role_filter, page, page_size)

def _get_search_results(supabase, query_str: str, role_filter: Optional[str], page: int, page_size: int) -> Dict[str, Any]:
    # Search by name
    query_name = supabase.client.table('users').select('*').ilike('name', f'%{query_str}%')
    if role_filter:
        query_name = query_name.eq('role', role_filter)
    name_results = query_name.execute()
    
    # Search by email
    query_email = supabase.client.table('users').select('*').ilike('email', f'%{query_str}%')
    if role_filter:
        query_email = query_email.eq('role', role_filter)
    email_results = query_email.execute()
    
    # Merge results
    all_users_map = {}
    for u in (name_results.data or []):
        all_users_map[u['id']] = u
    for u in (email_results.data or []):
        all_users_map[u['id']] = u
        
    users_data = list(all_users_map.values())
    
    # Sort
    users_data.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    # Pagination
    total = len(users_data)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_users = users_data[start_idx:end_idx]
    
    return {"users": paginated_users, "total": total}

def _get_standard_results(supabase, role_filter: Optional[str], page: int, page_size: int) -> Dict[str, Any]:
    query = supabase.client.table('users').select('*', count='exact')
    
    if role_filter:
        query = query.eq('role', role_filter)
        
    query = query.order('created_at', desc=True)
    query = query.range((page - 1) * page_size, page * page_size - 1)
    
    result = query.execute()
    return {"users": result.data, "total": result.count}



def _search_by_name(supabase, query: str) -> List[Dict[str, Any]]:
    try:
        res = supabase.client.table('users').select('id, name, email').ilike('name', f'%{query}%').limit(50).execute()
        return res.data or []
    except Exception as e:
        print(f"Name search error: {e}")
        return []

def _search_by_email(supabase, query: str) -> List[Dict[str, Any]]:
    try:
        res = supabase.client.table('users').select('id, name, email').ilike('email', f'%{query}%').limit(50).execute()
        return res.data or []
    except Exception as e:
        print(f"Email search error: {e}")
        return []

def _search_by_id(supabase, query: str) -> List[Dict[str, Any]]:
    clean_hex = query.replace('-', '')
    if not (re.match(r'^[0-9a-f]+$', clean_hex) and len(clean_hex) <= 32):
        return []
        
    def to_uuid(hex_s):
        return f"{hex_s[:8]}-{hex_s[8:12]}-{hex_s[12:16]}-{hex_s[16:20]}-{hex_s[20:]}"

    try:
        # Exact Match
        if len(clean_hex) == 32:
            target_id = to_uuid(clean_hex)
            res = supabase.client.table('users').select('id, name, email').eq('id', target_id).execute()
            return res.data or []
        
        # Prefix Search
        else:
            start_uuid = to_uuid(clean_hex.ljust(32, '0'))
            end_uuid = to_uuid(clean_hex.ljust(32, 'f'))
            
            res = supabase.client.table('users').select('id, name, email')\
                .gte('id', start_uuid)\
                .lte('id', end_uuid)\
                .limit(50).execute()
            return res.data or []
            
    except Exception as e:
        print(f"ID search error: {e}")
        return []

def search_users_db(query: str, current_user_id: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
    """
    Search for users by name, email, or ID (exact/prefix).
    Returns a list of user dictionaries.
    """
    supabase = get_supabase_service()
    clean_query = query.strip().lower()
    
    if len(clean_query) < 2:
        return []

    all_users = {}

    # Execute search strategies
    for user in _search_by_name(supabase, clean_query):
        all_users[user['id']] = user
        
    for user in _search_by_email(supabase, clean_query):
        all_users[user['id']] = user
        
    for user in _search_by_id(supabase, clean_query):
        all_users[user['id']] = user
    
    # Filter out current user and limit results
    users_list = [
        user for user in all_users.values() 
        if not current_user_id or user['id'] != current_user_id
    ]
    
    return users_list[:limit]

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
