from fastapi import HTTPException, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, Optional
from dataclasses import dataclass
import jwt
from utils.config import get_config

settings = get_config()
security = HTTPBearer()

@dataclass
class FaceUploads:
    """Dependency class to group face image uploads."""
    image: Optional[UploadFile] = File(None)
    image_front: Optional[UploadFile] = File(None)
    image_left: Optional[UploadFile] = File(None)
    image_right: Optional[UploadFile] = File(None)
    image_up: Optional[UploadFile] = File(None)
    image_down: Optional[UploadFile] = File(None)

    def to_dict(self) -> Dict[str, UploadFile]:
        """Extract present face images into a dictionary."""
        uploads = {
            'image': self.image,  # Legacy/Generic fallback
            'image_front': self.image_front,
            'image_left': self.image_left,
            'image_right': self.image_right,
            'image_up': self.image_up,
            'image_down': self.image_down
        }
        return {k: v for k, v in uploads.items() if v is not None}

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Verify JWT token and return current user payload (including role)
    """
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

def verify_user_access(current_user: dict, target_user_id: str):
    """
    Verify that the current user is authorized to access/modify the target user's data.
    Allows access if:
    1. current_user is the target_user (self-access)
    2. current_user has 'admin' role
    """
    current_user_id = (current_user or {}).get("sub")
    role = (current_user or {}).get("role") or "user"
    
    if current_user_id != target_user_id and role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to access this user data")

def get_current_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency to verify that the current user has 'admin' role.
    """
    role = current_user.get("role")
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user
