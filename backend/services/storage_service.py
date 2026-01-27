"""
Supabase storage service for Smart Glass AI system.
Handles database operations and image storage.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from supabase import create_client, Client
import uuid

from utils.config import config
from models.user import UserCreate, UserResponse
from models.face_encoding import FaceEncoding


class SupabaseError(Exception):
    """Custom exception for Supabase operations."""
    pass


class SupabaseService:
    """Service for Supabase database and storage operations."""
    
    def __init__(self):
        """Initialize Supabase client with environment variables."""
        if not config.SUPABASE_URL:
            raise SupabaseError(
                "Supabase configuration missing. Please set SUPABASE_URL"
            )
        
        # Use service key if available (for bypassing RLS), otherwise use anon key
        supabase_key = config.SUPABASE_SERVICE_KEY or config.SUPABASE_KEY
        
        if not supabase_key:
            raise SupabaseError(
                "Supabase key missing. Please set SUPABASE_SERVICE_KEY or SUPABASE_KEY"
            )
        
        try:
            self.client: Client = create_client(
                config.SUPABASE_URL,
                supabase_key
            )
            self.storage_bucket = "face-images"
        except Exception as e:
            raise SupabaseError(f"Failed to initialize Supabase client: {str(e)}")
    
    def check_connection(self) -> bool:
        """
        Check if Supabase connection is healthy.
        
        Returns:
            True if connection is healthy, False otherwise
        """
        try:
            # Try a simple query to check connection
            response = self.client.table('users').select('id').limit(1).execute()
            return True
        except Exception as e:
            print(f"Supabase connection check failed: {str(e)}")
            return False
    
    def get_health_status(self) -> Dict[str, Any]:
        """
        Get detailed health status of Supabase connection.
        
        Returns:
            Dictionary with health status information
        """
        try:
            is_connected = self.check_connection()
            return {
                "connected": is_connected,
                "url": config.SUPABASE_URL[:30] + "..." if config.SUPABASE_URL else "Not configured",
                "status": "operational" if is_connected else "unavailable"
            }
        except Exception as e:
            return {
                "connected": False,
                "url": config.SUPABASE_URL[:30] + "..." if config.SUPABASE_URL else "Not configured",
                "status": "error",
                "error": str(e)
            }
    
    def save_user(
        self,
        user_data: UserCreate,
        image_url: Optional[str] = None
    ) -> UserResponse:
        """
        Save user data to Supabase users table.
        
        Args:
            user_data: User information to save
            image_url: Optional URL to user's face image
            
        Returns:
            UserResponse with saved user data including ID
            
        Raises:
            SupabaseError: If save operation fails or user already exists
        """
        try:
            # Check if user with this email already exists
            existing_user = self.client.table('users').select('*').eq('email', user_data.email).execute()
            
            if existing_user.data and len(existing_user.data) > 0:
                raise SupabaseError(
                    f"User with email {user_data.email} already exists"
                )
            
            # Prepare user data for insertion
            user_dict = {
                "name": user_data.name,
                "email": user_data.email,
                "phone": user_data.phone,
                "image_url": image_url,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Insert user into database
            response = self.client.table('users').insert(user_dict).execute()
            
            if not response.data or len(response.data) == 0:
                raise SupabaseError("Failed to insert user data")
            
            # Convert response to UserResponse model
            user_record = response.data[0]
            return UserResponse(
                id=user_record['id'],
                name=user_record['name'],
                email=user_record['email'],
                phone=user_record.get('phone'),
                image_url=user_record.get('image_url'),
                registered_at=datetime.fromisoformat(user_record['created_at'].replace('Z', '+00:00'))
            )
            
        except SupabaseError:
            raise
        except Exception as e:
            raise SupabaseError(f"Failed to save user: {str(e)}")
    
    def get_user(self, user_id: str) -> Optional[UserResponse]:
        """
        Retrieve user data by ID from Supabase.
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            UserResponse if user found, None otherwise
            
        Raises:
            SupabaseError: If retrieval operation fails
        """
        try:
            response = self.client.table('users').select('*').eq('id', user_id).execute()
            
            if not response.data or len(response.data) == 0:
                return None
            
            user_record = response.data[0]
            return UserResponse(
                id=user_record['id'],
                name=user_record['name'],
                email=user_record['email'],
                phone=user_record.get('phone'),
                image_url=user_record.get('image_url'),
                registered_at=datetime.fromisoformat(user_record['created_at'].replace('Z', '+00:00'))
            )
            
        except Exception as e:
            raise SupabaseError(f"Failed to retrieve user: {str(e)}")
    
    def save_face_encoding(
        self,
        user_id: str,
        encoding: List[float]
    ) -> bool:
        """
        Save face encoding to Supabase face_encodings table.
        
        Args:
            user_id: User identifier
            encoding: 128-dimensional face encoding vector
            
        Returns:
            True if save successful
            
        Raises:
            SupabaseError: If save operation fails
        """
        try:
            # Check if encoding already exists for this user
            existing = self.client.table('face_encodings').select('id').eq('user_id', user_id).execute()
            
            encoding_data = {
                "user_id": user_id,
                "encoding": encoding,
                "created_at": datetime.utcnow().isoformat()
            }
            
            if existing.data and len(existing.data) > 0:
                # Update existing encoding
                response = self.client.table('face_encodings').update(
                    {"encoding": encoding, "created_at": datetime.utcnow().isoformat()}
                ).eq('user_id', user_id).execute()
            else:
                # Insert new encoding
                response = self.client.table('face_encodings').insert(encoding_data).execute()
            
            return response.data is not None and len(response.data) > 0
            
        except Exception as e:
            raise SupabaseError(f"Failed to save face encoding: {str(e)}")
    
    def get_all_encodings(self) -> List[Dict[str, Any]]:
        """
        Retrieve all face encodings from Supabase for matching.
        
        Returns:
            List of dictionaries containing user_id and encoding
            
        Raises:
            SupabaseError: If retrieval operation fails
        """
        try:
            response = self.client.table('face_encodings').select('user_id, encoding').execute()
            
            if not response.data:
                return []
            
            return response.data
            
        except Exception as e:
            raise SupabaseError(f"Failed to retrieve encodings: {str(e)}")
    
    def get_face_image_metadata(self, user_id: str, image_type: str) -> Optional[Dict[str, Any]]:
        """
        Get metadata for a specific face image type.
        
        Args:
            user_id: User identifier
            image_type: Type of image (e.g., 'avatar', 'front')
            
        Returns:
            Dictionary with image metadata or None if not found
        """
        try:
            response = self.client.table('face_images') \
                .select('image_url, created_at') \
                .eq('user_id', user_id) \
                .eq('image_type', image_type) \
                .order('created_at', desc=True) \
                .limit(1) \
                .execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            return None

    def get_storage_public_url(self, path: str) -> str:
        """Get public URL for a file in the face-images bucket."""
        return self.client.storage.from_(self.storage_bucket).get_public_url(path)

    def upload_image(
        self,
        image_bytes: bytes,
        user_id: str,
        file_extension: str = "jpg"
    ) -> str:
        """
        Upload face image to Supabase Storage and return public URL.
        
        Args:
            image_bytes: Raw image bytes
            user_id: User identifier for filename generation
            file_extension: File extension (jpg, png, etc.)
            
        Returns:
            Public URL of uploaded image
            
        Raises:
            SupabaseError: If upload operation fails
        """
        try:
            # Generate unique filename
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"{user_id}_{timestamp}.{file_extension}"
            
            # Upload to Supabase Storage
            response = self.client.storage.from_(self.storage_bucket).upload(
                path=filename,
                file=image_bytes,
                file_options={"content-type": f"image/{file_extension}"}
            )
            
            # Get public URL
            public_url = self.client.storage.from_(self.storage_bucket).get_public_url(filename)
            
            return public_url
            
        except Exception as e:
            raise SupabaseError(f"Failed to upload image: {str(e)}")


# Singleton instance
_supabase_service_instance: Optional[SupabaseService] = None


def get_supabase_service() -> SupabaseService:
    """
    Get or create the Supabase service singleton instance.
    
    Returns:
        SupabaseService instance
    """
    global _supabase_service_instance
    if _supabase_service_instance is None:
        _supabase_service_instance = SupabaseService()
    return _supabase_service_instance
