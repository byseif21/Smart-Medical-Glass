"""
Profile picture service for Smart Glass AI system.
Handles retrieval of front-facing face images for profile display.
"""

from typing import Optional, TYPE_CHECKING
from supabase import Client
from datetime import datetime
import logging

if TYPE_CHECKING:
    from services.storage_service import SupabaseService

logger = logging.getLogger(__name__)


class ProfilePictureError(Exception):
    """Custom exception for profile picture operations."""
    pass


def get_profile_picture_url(user_id: str, supabase_service: 'SupabaseService') -> Optional[str]:
    """
    Retrieve the profile picture URL for a user.
    
    This function queries the face_images table for images.
    It prioritizes 'avatar' type images, then falls back to 'front' type.
    Returns the most recently created image's full public URL.
    
    Args:
        user_id: The user's unique identifier (UUID)
        supabase_service: SupabaseService instance
        
    Returns:
        Full public URL string if an image is found, None otherwise
        
    Raises:
        ProfilePictureError: If database query fails
    """
    try:
        # First try to get 'avatar' image
        avatar_data = supabase_service.get_face_image_metadata(user_id, 'avatar')
        
        if avatar_data:
            image_path = avatar_data['image_url']
            created_at = avatar_data['created_at']
            timestamp = 0
            try:
                dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                timestamp = int(dt.timestamp())
            except ValueError:
                pass
                
            base_url = supabase_service.get_storage_public_url(image_path)
            return f"{base_url}?t={timestamp}"

        # Fallback to 'front' image
        front_data = supabase_service.get_face_image_metadata(user_id, 'front')
        
        if front_data:
            image_path = front_data['image_url']
            created_at = front_data['created_at']
            timestamp = 0
            try:
                dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                timestamp = int(dt.timestamp())
            except ValueError:
                pass
            
            base_url = supabase_service.get_storage_public_url(image_path)
            return f"{base_url}?t={timestamp}"
        
        return None
        
    except Exception as e:
        logger.error(f"Error getting profile picture for user {user_id}: {str(e)}")
        return None


def save_profile_picture(user_id: str, image_bytes: bytes, supabase_service: 'SupabaseService') -> str:
    """
    Upload and save user profile picture (avatar).
    
    Args:
        user_id: The user's unique identifier
        image_bytes: The raw image data
        supabase_service: SupabaseService instance
        
    Returns:
        The public URL of the uploaded profile picture
        
    Raises:
        ProfilePictureError: If upload or database update fails
    """
    try:
        file_path = f"{user_id}/avatar.jpg"
        
        # Always try to remove the file first.
        # This avoids "Duplicate" errors and doesn't rely on flaky 'upsert' behavior
        try:
            supabase_service.client.storage.from_('face-images').remove([file_path])
        except Exception:
            # Ignore errors
            pass

        # upload the new file
        supabase_service.client.storage.from_('face-images').upload(
            file_path,
            image_bytes,
            {"content-type": "image/jpeg"}
        )
        
        # Update database record (delete old, insert new)
        supabase_service.client.table('face_images').delete() \
            .eq('user_id', user_id) \
            .eq('image_type', 'avatar') \
            .execute()
            
        supabase_service.client.table('face_images').insert({
            "user_id": user_id,
            "image_url": file_path,
            "image_type": "avatar"
        }).execute()
        
        return supabase_service.get_storage_public_url(file_path)
        
    except Exception as e:
        raise ProfilePictureError(f"Failed to save profile picture: {str(e)}")
