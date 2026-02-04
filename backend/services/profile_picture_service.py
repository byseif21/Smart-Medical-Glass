"""
Profile picture service for Smart Glass AI system.
Handles retrieval of front-facing face images for profile display.
"""

from typing import Optional, TYPE_CHECKING
from datetime import datetime
import logging
from services.face_service import get_face_service

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
            return _construct_timestamped_url(supabase_service, avatar_data['image_url'], avatar_data['created_at'])

        # Fallback to 'front' image
        front_data = supabase_service.get_face_image_metadata(user_id, 'front')
        
        if front_data:
            return _construct_timestamped_url(supabase_service, front_data['image_url'], front_data['created_at'])
        
        return None
        
    except Exception as e:
        logger.error(f"Error getting profile picture for user {user_id}: {str(e)}")
        return None

def _construct_timestamped_url(supabase_service, image_path: str, created_at: str) -> str:
    """Helper to append timestamp to image URL for cache busting."""
    timestamp = 0
    try:
        dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        timestamp = int(dt.timestamp())
    except ValueError:
        # Fallback to 0 if date format is invalid; this disables cache busting.
        logger.warning(
            "Failed to parse created_at timestamp '%s' for image '%s'; "
            "falling back to non-busted cache URL.",
            created_at,
            image_path,
        )
        pass
        
    base_url = supabase_service.get_storage_public_url(image_path)
    return f"{base_url}?t={timestamp}"


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
        # auto-crop face
        face_service = get_face_service()
        cropped_bytes = face_service.crop_face(image_bytes)
        
        if cropped_bytes is None:
            raise ProfilePictureError("Invalid image: strictly one face must be visible.")
    
        image_bytes = cropped_bytes

        file_path = f"{user_id}/avatar.jpg"
        
        # Always try to remove the file first.
        # This avoids "Duplicate" errors and doesn't rely on flaky 'upsert' behavior
        supabase_service.delete_file('face-images', file_path)

        # upload the new file
        supabase_service.upload_file(
            bucket='face-images',
            path=file_path,
            file_data=image_bytes,
            content_type="image/jpeg"
        )
        
        # Update database record via storage service
        supabase_service.update_face_image_metadata(user_id, 'avatar', file_path)
        
        return supabase_service.get_storage_public_url(file_path)
        
    except Exception as e:
        raise ProfilePictureError(f"Failed to save profile picture: {str(e)}")
