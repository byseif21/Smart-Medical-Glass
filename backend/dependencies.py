from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any
import jwt
from utils.config import get_config

settings = get_config()
security = HTTPBearer()

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
