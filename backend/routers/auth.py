from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from pydantic import BaseModel, Field, field_validator
try:
    import email_validator  # noqa: F401
    from pydantic import EmailStr as EmailType
except Exception:
    EmailType = str
from typing import Optional, Dict, Any
import jwt
from datetime import datetime, timedelta
from services.storage_service import get_supabase_service
from services.face_service import get_face_service
from services.profile_picture_service import get_profile_picture_url
from services.security import verify_password, hash_password
from utils.config import get_config
from dependencies import get_current_user, security
from utils.validation import normalize_email

router = APIRouter(prefix="/api", tags=["authentication"])
settings = get_config()

class LoginRequest(BaseModel):
    email: EmailType
    password: str

    @field_validator('email')
    def validate_email_field(cls, v):
        return normalize_email(v)

class LoginResponse(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    token: str
    message: str

class FaceLoginConfirmRequest(BaseModel):
    user_id: str
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)

def create_access_token(data: dict):
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest):
    """
    Traditional email/password login
    """
    supabase = get_supabase_service()
    
    try:
        # Get user by email
        response = supabase.client.table('users').select('*').eq('email', credentials.email).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user = response.data[0]
        
        # Verify password
        if not verify_password(credentials.password, user['password_hash']):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Create access token
        role = user.get('role') or 'user'
        token = create_access_token({"sub": user['id'], "email": user['email'], "role": role})
        
        return LoginResponse(
            user_id=user['id'],
            name=user['name'],
            email=user['email'],
            role=role,
            token=token,
            message="Login successful"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@router.post("/login/face")
async def login_with_face(image: UploadFile = File(...)):
    """
    Face ID identify - identify user by face recognition (no token)
    """
    supabase = get_supabase_service()
    face_service = get_face_service()
    
    try:
        # Read and process image
        image_data = await image.read()
        
        # Extract face encoding from uploaded image
        result = face_service.extract_encoding(image_data)
        
        if not result.success or result.encoding is None:
            error_msg = result.error or "No face detected in the image"
            raise HTTPException(status_code=400, detail=error_msg)
        
        # Use face service to find match
        match_result = face_service.find_match(result.encoding)
        
        if not match_result.matched or match_result.user_id is None:
            raise HTTPException(
                status_code=404, 
                detail="Face not recognized. Please try again or use email login."
            )
        
        # Get user details from database
        response = supabase.client.table('users').select('id, name, email, phone, id_number').eq('id', match_result.user_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = response.data[0]
        
        profile_picture_url = None
        try:
            profile_picture_url = get_profile_picture_url(user['id'], supabase)
        except Exception:
            profile_picture_url = None
        
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
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face login failed: {str(e)}")

@router.post("/login/face/confirm", response_model=LoginResponse)
async def confirm_face_login(payload: FaceLoginConfirmRequest):
    """
    Confirm Face ID login by verifying password and issuing token
    """
    supabase = get_supabase_service()

    try:
        response = supabase.client.table('users').select('*').eq('id', payload.user_id).execute()

        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="User not found")

        user = response.data[0]

        if not verify_password(payload.password, user['password_hash']):
            raise HTTPException(status_code=401, detail="Invalid password")

        role = user.get('role') or 'user'
        token = create_access_token({"sub": user['id'], "email": user['email'], "role": role})

        return LoginResponse(
            user_id=user['id'],
            name=user['name'],
            email=user['email'],
            role=role,
            token=token,
            message="Login successful"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@router.post("/auth/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Change user password
    """
    supabase = get_supabase_service()
    user_id = current_user.get("sub")
    
    try:
        # Get current user to verify password
        response = supabase.client.table('users').select('password_hash').eq('id', user_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = response.data[0]
        
        # Verify current password
        if not verify_password(payload.current_password, user['password_hash']):
            raise HTTPException(status_code=400, detail="Invalid current password")
            
        # Hash new password
        new_password_hash = hash_password(payload.new_password)
        
        # Update password
        update_response = supabase.client.table('users').update({
            "password_hash": new_password_hash
        }).eq('id', user_id).execute()
        
        if not update_response.data:
            raise HTTPException(status_code=500, detail="Failed to update password")
            
        return {"message": "Password updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Password update failed: {str(e)}")

