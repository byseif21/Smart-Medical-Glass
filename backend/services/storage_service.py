"""
Supabase storage service for Smart Glass AI system.
Handles database operations and image storage.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from supabase import create_client, Client
import uuid

from utils.config import config
from models.user import UserCreate, UserResponse, UserSearchFilters


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
        extra_data: Optional[Dict[str, Any]] = None
    ) -> UserResponse:
        """
        Save user data to Supabase users table.
        
        Args:
            user_data: User information to save
            extra_data: Optional dictionary of additional fields (e.g., password_hash, dob)
            
        Returns:
            UserResponse with saved user data including ID
            
        Raises:
            SupabaseError: If save operation fails or user already exists
        """
        try:
            self._ensure_user_not_exists(user_data.email)
            user_dict = self._prepare_user_dict(user_data, extra_data)
            user_record = self._insert_user_record(user_dict)
            return self._map_to_user_response(user_record)
            
        except SupabaseError:
            raise
        except Exception as e:
            raise SupabaseError(f"Failed to save user: {str(e)}")

    def _ensure_user_not_exists(self, email: str) -> None:
        """Check if user with given email already exists."""
        existing_user = self.client.table('users').select('*').eq('email', email).execute()
        if existing_user.data and len(existing_user.data) > 0:
            raise SupabaseError(f"User with email {email} already exists")

    def _prepare_user_dict(
        self, 
        user_data: UserCreate, 
        extra_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Prepare user dictionary for database insertion."""
        user_dict = {
            "name": user_data.name,
            "email": user_data.email,
            "phone": user_data.phone
        }
        
        if extra_data:
            user_dict.update(extra_data)
            
        return user_dict

    def _insert_user_record(self, user_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Insert user record into database and return the result."""
        response = self.client.table('users').insert(user_dict).execute()
        if not response.data or len(response.data) == 0:
            raise SupabaseError("Failed to insert user data")
        return response.data[0]

    def _map_to_user_response(self, user_record: Dict[str, Any]) -> UserResponse:
        """Convert database record to UserResponse model."""
        return UserResponse(
            id=user_record['id'],
            name=user_record['name'],
            email=user_record['email'],
            phone=user_record.get('phone'),
            image_url=user_record.get('image_url'),
            registered_at=datetime.fromisoformat(user_record['created_at'].replace('Z', '+00:00'))
        )
    
    def _fetch_user_record(self, column: str, value: str, select: str = '*') -> Optional[Dict[str, Any]]:
        """
        Internal helper to fetch a single user record by a specific column.
        
        Args:
            column: Column to filter by (e.g., 'id', 'email')
            value: Value to match
            select: Columns to select (default: '*')
            
        Returns:
            User record dict or None
        """
        response = self.client.table('users').select(select).eq(column, value).execute()
        if not response.data or len(response.data) == 0:
            return None
        return response.data[0]

    def _get_user_response(self, column: str, value: str, error_context: str) -> Optional[UserResponse]:
        """Helper to fetch user and map to response with error handling."""
        try:
            user_record = self._fetch_user_record(column, value)
            return self._map_to_user_response(user_record) if user_record else None
        except Exception as e:
            raise SupabaseError(f"{error_context}: {str(e)}")

    def _get_user_dict(self, column: str, value: str, error_context: str, select: str = '*') -> Optional[Dict[str, Any]]:
        """Helper to fetch user dict with error handling."""
        try:
            return self._fetch_user_record(column, value, select)
        except Exception as e:
            raise SupabaseError(f"{error_context}: {str(e)}")

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
        return self._get_user_response('id', user_id, "Failed to retrieve user")

    def update_user(self, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update user data in Supabase.
        
        Args:
            user_id: Unique user identifier
            updates: Dictionary of fields to update
            
        Returns:
            Updated user record (dict) if successful, None if user not found
            
        Raises:
            SupabaseError: If update operation fails
        """
        try:
            updates['updated_at'] = datetime.utcnow().isoformat()
            response = self.client.table('users').update(updates).eq('id', user_id).execute()
            
            if not response.data or len(response.data) == 0:
                return None
                
            return response.data[0]
        except Exception as e:
            raise SupabaseError(f"Failed to update user: {str(e)}")

    def delete_user(self, user_id: str) -> bool:
        """
        Delete a user from the database.
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            True if deletion was successful
            
        Raises:
            SupabaseError: If deletion operation fails
        """
        try:
            self.client.table('users').delete().eq('id', user_id).execute()
            return True
        except Exception as e:
            raise SupabaseError(f"Failed to delete user: {str(e)}")

    def get_user_by_email(self, email: str) -> Optional[UserResponse]:
        """
        Retrieve user data by email from Supabase.
        
        Args:
            email: User's email address
            
        Returns:
            UserResponse if user found, None otherwise
            
        Raises:
            SupabaseError: If retrieval operation fails
        """
        return self._get_user_response('email', email, "Failed to retrieve user by email")

    def get_user_with_password(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve user record including password hash by email.
        
        Returns:
            User dictionary or None
        """
        return self._get_user_dict('email', email, "Failed to retrieve user with password")

    def get_user_password_hash(self, user_id: str) -> Optional[str]:
        """
        Retrieve just the password hash for a user.
        
        Returns:
            Password hash string or None
        """
        record = self._get_user_dict('id', user_id, "Failed to retrieve password hash", select='password_hash')
        return record.get('password_hash') if record else None

    def get_users_with_encodings(self) -> List[Dict[str, Any]]:
        """
        Retrieve all users that have face encodings.
        
        Returns:
            List of user records with encodings
        """
        try:
            response = self.client.table('users').select(
                'id, name, email, face_encoding, face_updated_at'
            ).not_.is_('face_encoding', 'null').execute()
            return response.data or []
        except Exception as e:
            raise SupabaseError(f"Failed to retrieve user encodings: {str(e)}")

    def get_encoding_count(self) -> int:
        """
        Get count of users with face encodings.
        
        Returns:
            Count of users with encodings
        """
        try:
            response = self.client.table('users').select('id', count='exact').not_.is_('face_encoding', 'null').execute()
            return response.count or 0
        except Exception as e:
            raise SupabaseError(f"Failed to get encoding count: {str(e)}")

    def _build_search_query(self, query_obj, query_str: str, role: Optional[str], exclude_id: Optional[str]):
        """Helper to build search query filters."""
        if query_str:
            # Check if query is a valid UUID
            is_uuid = False
            try:
                uuid_obj = uuid.UUID(query_str)
                normalized_uuid = str(uuid_obj)
                is_uuid = True
            except ValueError:
                # Not a valid UUID, treat as regular search string
                pass

            # Sanitize query string to prevent injection in PostgREST syntax
            safe_query = query_str.replace(',', '').replace('(', '').replace(')', '')     
            if is_uuid:
                or_condition = f"id.eq.{normalized_uuid},name.ilike.%{safe_query}%,email.ilike.%{safe_query}%"
            else:
                or_condition = f"name.ilike.%{safe_query}%,email.ilike.%{safe_query}%"
            query_obj = query_obj.or_(or_condition)
        
        if role:
            query_obj = query_obj.eq('role', role)
        if exclude_id:
            query_obj = query_obj.neq('id', exclude_id)
            
        return query_obj.order('created_at', desc=True)

    def search_users(self, filters: UserSearchFilters) -> Dict[str, Any]:
        """
        Search users with pagination using a filters object.
        
        Args:
            filters: Search criteria and pagination settings
            
        Returns:
            Dict with "users" list and "total" count
        """
        try:
            query = self.client.table('users').select('*', count='exact')
            query = self._build_search_query(query, filters.query, filters.role, filters.exclude_id)
            
            page = filters.page
            page_size = filters.page_size
            query = query.range((page - 1) * page_size, page * page_size - 1)
            
            result = query.execute()
            return {"users": result.data or [], "total": result.count or 0}
        except Exception as e:
            raise SupabaseError(f"Failed to search users: {str(e)}")

    def get_full_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve complete user profile data (raw record).
        
        Returns:
            User dictionary or None
        """
        return self._get_user_dict('id', user_id, "Failed to retrieve full profile")
    
    def get_face_image_metadata(self, user_id: str, image_type: str) -> Optional[Dict[str, Any]]:
        """
        Get metadata for a specific face image type.
        """
        try:
            result = self.client.table('face_images') \
                .select('*') \
                .eq('user_id', user_id) \
                .eq('image_type', image_type) \
                .order('created_at', desc=True) \
                .limit(1) \
                .execute()
                
            return result.data[0] if result.data else None
        except Exception as e:
            raise SupabaseError(f"Failed to get face image metadata: {str(e)}")

    def update_face_image_metadata(self, user_id: str, image_type: str, image_path: str) -> None:
        """
        Update face image metadata. Deletes old record and inserts new one.
        """
        try:
            # Delete old record
            self.client.table('face_images').delete() \
                .eq('user_id', user_id) \
                .eq('image_type', image_type) \
                .execute()
                
            # Insert new record
            self.client.table('face_images').insert({
                "user_id": user_id,
                "image_url": image_path,
                "image_type": image_type
            }).execute()
        except Exception as e:
            raise SupabaseError(f"Failed to update face image metadata: {str(e)}")

    def upload_file(
        self, 
        bucket: str, 
        path: str, 
        file_data: bytes, 
        content_type: str = "image/jpeg",
        upsert: bool = False
    ) -> Dict[str, Any]:
        """
        Generic file upload to Supabase Storage.
        
        Args:
            bucket: Storage bucket name
            path: File path within bucket
            file_data: Raw file bytes
            content_type: MIME type
            upsert: Whether to overwrite existing file
            
        Returns:
            Response data from Supabase
        """
        try:
            file_options = {"content-type": content_type}
            if upsert:
                file_options["upsert"] = "true"
                
            response = self.client.storage.from_(bucket).upload(
                path,
                file_data,
                file_options
            )
            return response
        except Exception as e:
            raise SupabaseError(f"Failed to upload file to {bucket}/{path}: {str(e)}")

    def delete_file(self, bucket: str, path: str) -> bool:
        """
        Generic file delete from Supabase Storage.
        """
        try:
            self.client.storage.from_(bucket).remove([path])
            return True
        except Exception as e:
            # Log but don't fail if file doesn't exist
            print(f"Warning: Failed to delete file {bucket}/{path}: {str(e)}")
            return False

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
