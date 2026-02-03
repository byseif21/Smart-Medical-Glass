from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import jwt
from fastapi import HTTPException, UploadFile

from services.storage_service import get_supabase_service, SupabaseService
from services.face_service import get_face_service
from services.profile_picture_service import get_profile_picture_url
from services.security import verify_password, hash_password
from utils.config import get_config
from models.auth import LoginRequest, FaceLoginConfirmRequest, ChangePasswordRequest

settings = get_config()

class AuthService:
    def __init__(self):
        self.supabase: SupabaseService = get_supabase_service()
        self.face_service = get_face_service()

    def create_access_token(self, data: dict) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    def _generate_auth_response(self, user: Dict[str, Any], message: str = "Login successful") -> Dict[str, Any]:
        """Generate standard authentication response with token"""
        role = user.get('role') or 'user'
        token = self.create_access_token({"sub": user['id'], "email": user['email'], "role": role})
        
        return {
            "user_id": user['id'],
            "name": user['name'],
            "email": user['email'],
            "role": role,
            "token": token,
            "message": message
        }

    async def _get_user_by_id(self, user_id: str, fields: str = "*") -> Dict[str, Any]:
        """Fetch user by ID with specified fields"""
        response = self.supabase.client.table('users').select(fields).eq('id', user_id).execute()
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="User not found")
        return response.data[0]

    async def login(self, credentials: LoginRequest) -> Dict[str, Any]:
        # Get user by email
        response = self.supabase.client.table('users').select('*').eq('email', credentials.email).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user = response.data[0]
        
        # Verify password
        if not verify_password(credentials.password, user['password_hash']):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        return self._generate_auth_response(user)

    async def _get_user_for_face_login(self, user_id: str) -> Dict[str, Any]:
        return await self._get_user_by_id(user_id, 'id, name, email, phone, id_number')

    def _get_safe_profile_picture_url(self, user_id: str) -> Optional[str]:
        """Safely get profile picture URL ignoring errors"""
        try:
            return get_profile_picture_url(user_id, self.supabase)
        except Exception:
            return None

    async def login_with_face(self, image_data: bytes) -> Dict[str, Any]:
        try:
            match_result = self.face_service.identify_user(image_data)
        except Exception as e:
            # Handle specific face recognition errors (e.g., image processing issues)
            raise HTTPException(status_code=400, detail=str(e))
        
        if not match_result.matched or not match_result.user_id:
            raise HTTPException(
                status_code=404, 
                detail="Face not recognized. Please try again or use email login."
            )
        
        # Get user details from database
        user = await self._get_user_for_face_login(match_result.user_id)
        profile_picture_url = self._get_safe_profile_picture_url(user['id'])
        
        return {
            "user_id": user['id'],
            "name": user['name'],
            "email": user['email'],
            "phone": user.get('phone'),
            "id_number": user.get('id_number'),
            "profile_picture_url": profile_picture_url,
            "confidence": match_result.confidence,
            "message": "Face identified successfully"
        }

    async def confirm_face_login(self, payload: FaceLoginConfirmRequest) -> Dict[str, Any]:
        user = await self._get_user_by_id(payload.user_id)

        if not verify_password(payload.password, user['password_hash']):
            raise HTTPException(status_code=401, detail="Invalid password")

        return self._generate_auth_response(user)

    async def change_password(self, user_id: str, payload: ChangePasswordRequest) -> Dict[str, str]:
        # Get current user to verify password
        response = self.supabase.client.table('users').select('password_hash').eq('id', user_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = response.data[0]
        
        # Verify current password
        if not verify_password(payload.current_password, user['password_hash']):
            raise HTTPException(status_code=400, detail="Invalid current password")
            
        # Hash new password
        new_password_hash = hash_password(payload.new_password)
        
        # Update password
        updated_user = self.supabase.update_user(user_id, {
            "password_hash": new_password_hash
        })
        
        if not updated_user:
            raise HTTPException(status_code=500, detail="Failed to update password")
            
        return {"message": "Password updated successfully"}
