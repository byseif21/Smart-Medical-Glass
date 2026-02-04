from fastapi import APIRouter, Form, Depends
from typing import Optional
from dataclasses import dataclass
from services.user_service import register_new_user
from models.user import RegistrationRequest
from dependencies import FaceUploads

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
