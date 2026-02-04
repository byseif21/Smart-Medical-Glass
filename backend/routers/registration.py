from fastapi import APIRouter, Form, Depends
from typing import Optional
from services.user_service import register_new_user
from models.user import RegistrationRequest
from dependencies import FaceUploads, RegistrationFormData

router = APIRouter(prefix="/api", tags=["registration"])

@router.post("/register")
async def register_user(
    form_data: RegistrationFormData = Depends(),
    face_uploads: FaceUploads = Depends()
):
    """
    Register a new user with face image(s) and personal information.
    Supports both single image and multi-angle face capture.
    """
    # Delegate business logic to user_service
    return await register_new_user(
        form_data.to_registration_request(), 
        face_uploads.to_dict()
    )
