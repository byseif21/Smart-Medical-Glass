from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import Optional, Dict, Any
from dataclasses import dataclass
from services.user_service import register_new_user
from models.user import RegistrationRequest

router = APIRouter(prefix="/api", tags=["registration"])

@dataclass
class RegistrationFormData:
    name: str = Form(...)
    email: str = Form(...)
    password: str = Form(...)
    phone: Optional[str] = Form(None)
    date_of_birth: Optional[str] = Form(None)
    gender: Optional[str] = Form(None)
    nationality: Optional[str] = Form(None)
    id_number: Optional[str] = Form(None)
    image: Optional[UploadFile] = File(None)
    image_front: Optional[UploadFile] = File(None)
    image_left: Optional[UploadFile] = File(None)
    image_right: Optional[UploadFile] = File(None)
    image_up: Optional[UploadFile] = File(None)
    image_down: Optional[UploadFile] = File(None)

@router.post("/register")
async def register_user(form_data: RegistrationFormData = Depends()):
    """
    Register a new user with face image(s) and personal information.
    Supports both single image and multi-angle face capture.
    """
    # Create request object
    request = RegistrationRequest(
        name=form_data.name,
        email=form_data.email,
        password=form_data.password,
        phone=form_data.phone,
        date_of_birth=form_data.date_of_birth,
        gender=form_data.gender,
        nationality=form_data.nationality,
        id_number=form_data.id_number
    )
    
    # Collect images
    face_images = {
        'image': form_data.image,
        'image_front': form_data.image_front,
        'image_left': form_data.image_left,
        'image_right': form_data.image_right,
        'image_up': form_data.image_up,
        'image_down': form_data.image_down
    }

    # Delegate business logic to user_service
    return await register_new_user(request, face_images)
