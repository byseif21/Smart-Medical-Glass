"""
Profile picture service for Smart Glass AI system.
Handles retrieval of front-facing face images for profile display.
"""

from typing import Optional
from supabase import Client


class ProfilePictureError(Exception):
    """Custom exception for profile picture operations."""
    pass


def get_profile_picture_url(user_id: str, supabase_client: Client) -> Optional[str]:
    """
    Retrieve the front-facing face image URL for a user.
    
    This function queries the face_images table for images with image_type='front'
    and returns the most recently created image's full public URL. If no front-facing 
    image exists, it returns None.
    
    Args:
        user_id: The user's unique identifier (UUID)
        supabase_client: Supabase client instance for database queries
        
    Returns:
        Full public URL string if a front-facing image is found, None otherwise
        
    Raises:
        ProfilePictureError: If database query fails
    """
    try:
        # Query face_images table for front-facing images
        # Filter by user_id and image_type='front'
        # Order by created_at DESC to get the most recent
        # Limit to 1 result
        response = supabase_client.table('face_images') \
            .select('image_url') \
            .eq('user_id', user_id) \
            .eq('image_type', 'front') \
            .order('created_at', desc=True) \
            .limit(1) \
            .execute()
        
        # Check if any results were returned
        if response.data and len(response.data) > 0:
            image_path = response.data[0]['image_url']
            
            # Convert storage path to full public URL
            # The image_path is stored as "user_id/front.jpg"
            # We need to get the public URL from the bucket
            public_url = supabase_client.storage.from_('face-images').get_public_url(image_path)
            return public_url
        
        return None
        
    except Exception as e:
        print(f"Error getting profile picture for user {user_id}: {str(e)}")
        return None
