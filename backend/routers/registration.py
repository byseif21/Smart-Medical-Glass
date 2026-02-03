from fastapi import APIRouter, UploadFile, File, Form, Depends
from typing import Optional
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

    def to_image_dict(self) -> dict:
        """Extract face images into a dictionary."""
        return {
            'image': self.image,
            'image_front': self.image_front,
            'image_left': self.image_left,
            'image_right': self.image_right,
            'image_up': self.image_up,
            'image_down': self.image_down
        }

    def to_registration_request(self) -> RegistrationRequest:
        """Convert form data to RegistrationRequest model."""
        return RegistrationRequest(
            name=self.name,
            email=self.email,
            password=self.password,
            phone=self.phone,
            date_of_birth=self.date_of_birth,
            gender=self.gender,
            nationality=self.nationality,
            id_number=self.id_number
        )

@router.post("/register")
async def register_user(form_data: RegistrationFormData = Depends()):
    """
    Register a new user with face image(s) and personal information.
    Supports both single image and multi-angle face capture.
    """
    # Delegate business logic to user_service
    return await register_new_user(
        form_data.to_registration_request(), 
        form_data.to_image_dict()
    )
