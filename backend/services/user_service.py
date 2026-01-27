from services.storage_service import get_supabase_service
from services.face_service import get_face_service

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
