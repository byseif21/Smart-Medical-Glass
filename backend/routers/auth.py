from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from typing import Optional, Dict, Any
from services.auth_service import AuthService
from dependencies import get_current_user
from utils.error_handlers import service_guard
from models.auth import (
    LoginRequest, 
    LoginResponse, 
    FaceLoginConfirmRequest, 
    ChangePasswordRequest
)

router = APIRouter(prefix="/api", tags=["authentication"])

def get_auth_service() -> AuthService:
    return AuthService()

@router.post("/login", response_model=LoginResponse)
async def login(
    credentials: LoginRequest,
    service: AuthService = Depends(get_auth_service)
):
    """
    Traditional email/password login
    """
    async with service_guard("Login failed"):
        result = await service.login(credentials)
        return LoginResponse(**result)

@router.post("/login/face")
async def login_with_face(
    image: UploadFile = File(...),
    service: AuthService = Depends(get_auth_service)
):
    """
    Face ID identify - identify user by face recognition (no token)
    """
    async with service_guard("Face login failed"):
        image_data = await image.read()
        return await service.login_with_face(image_data)

@router.post("/login/face/confirm", response_model=LoginResponse)
async def confirm_face_login(
    payload: FaceLoginConfirmRequest,
    service: AuthService = Depends(get_auth_service)
):
    """
    Confirm Face ID login by verifying password and issuing token
    """
    async with service_guard("Login failed"):
        result = await service.confirm_face_login(payload)
        return LoginResponse(**result)

@router.post("/auth/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service)
):
    """
    Change user password
    """
    user_id = current_user.get("sub")
    async with service_guard("Password update failed"):
        return await service.change_password(user_id, payload)
