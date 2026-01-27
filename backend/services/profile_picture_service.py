"""
Profile picture service for Smart Glass AI system.
Handles retrieval of front-facing face images for profile display.
"""

from typing import Optional
from supabase import Client
from datetime import datetime


class ProfilePictureError(Exception):
    """Custom exception for profile picture operations."""
    pass


def get_profile_picture_url(user_id: str, supabase_client: Client) -> Optional[str]:
    """
    Retrieve the profile picture URL for a user.
    
    This function queries the face_images table for images.
    It prioritizes 'avatar' type images, then falls back to 'front' type.
    Returns the most recently created image's full public URL.
    
    Args:
        user_id: The user's unique identifier (UUID)
        supabase_client: Supabase client instance for database queries
        
    Returns:
        Full public URL string if an image is found, None otherwise
        
    Raises:
        ProfilePictureError: If database query fails
    """
    try:
        # First try to get 'avatar' image
        response = supabase_client.table('face_images') \
            .select('image_url, created_at') \
            .eq('user_id', user_id) \
            .eq('image_type', 'avatar') \
            .order('created_at', desc=True) \
            .limit(1) \
            .execute()
            
        if response.data and len(response.data) > 0:
            image_path = response.data[0]['image_url']
            created_at = response.data[0]['created_at']
            try:
                dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                timestamp = int(dt.timestamp())
            except ValueError:
                # Fallback if parsing fails
                timestamp = 0
                
            base_url = supabase_client.storage.from_('face-images').get_public_url(image_path)
            return f"{base_url}?t={timestamp}"

        # Fallback to 'front' image
        response = supabase_client.table('face_images') \
            .select('image_url, created_at') \
            .eq('user_id', user_id) \
            .eq('image_type', 'front') \
            .order('created_at', desc=True) \
            .limit(1) \
            .execute()
        
        # Check if any results were returned
        if response.data and len(response.data) > 0:
            image_path = response.data[0]['image_url']
            created_at = response.data[0]['created_at']
            try:
                dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                timestamp = int(dt.timestamp())
            except ValueError:
                timestamp = 0
            
            # Convert storage path to full public URL
            # The image_path is stored as "user_id/front.jpg"
            # We need to get the public URL from the bucket
            public_url = supabase_client.storage.from_('face-images').get_public_url(image_path)
            return f"{public_url}?t={timestamp}"
        
        return None
        
    except Exception as e:
        print(f"Error getting profile picture for user {user_id}: {str(e)}")
        return None


def save_profile_picture(user_id: str, image_bytes: bytes, supabase_client: Client) -> str:
    """
    Upload and save user profile picture (avatar).
    
    Args:
        user_id: The user's unique identifier
        image_bytes: The raw image data
        supabase_client: Supabase client instance
        
    Returns:
        The public URL of the uploaded profile picture
        
    Raises:
        ProfilePictureError: If upload or database update fails
    """
    try:
        file_path = f"{user_id}/avatar.jpg"
        
        # 1. Upload to storage
        # We try to upload directly. If it fails due to duplication, we remove and re-upload.
        # This is because .update() is not available on SyncBucketProxy and upsert behavior can be inconsistent.
        try:
            supabase_client.storage.from_('face-images').upload(
                file_path,
                image_bytes,
                {"content-type": "image/jpeg"}
            )
        except Exception as storage_error:
            # Check if error is due to duplicate file
            error_str = str(storage_error)
            if "Duplicate" in error_str or "already exists" in error_str or "400" in error_str:
                # File exists, remove it first then upload new one
                print(f"File {file_path} exists, removing and re-uploading...")
                try:
                    supabase_client.storage.from_('face-images').remove([file_path])
                    supabase_client.storage.from_('face-images').upload(
                        file_path,
                        image_bytes,
                        {"content-type": "image/jpeg"}
                    )
                except Exception as retry_error:
                    print(f"Retry upload failed: {retry_error}")
                    raise retry_error
            else:
                # Re-raise other storage errors
                raise storage_error
        
        # 2. Update database record
        # Remove existing avatar entry to avoid duplicates
        supabase_client.table('face_images').delete() \
            .eq('user_id', user_id) \
            .eq('image_type', 'avatar') \
            .execute()
            
        # Insert new entry
        supabase_client.table('face_images').insert({
            "user_id": user_id,
            "image_url": file_path,
            "image_type": "avatar"
        }).execute()
        
        # 3. Return public URL
        return supabase_client.storage.from_('face-images').get_public_url(file_path)
        
    except Exception as e:
        raise ProfilePictureError(f"Failed to save profile picture: {str(e)}")
