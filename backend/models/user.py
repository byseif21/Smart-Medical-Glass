"""
User data models for Smart Glass AI system.
"""

from typing import Optional
from pydantic import BaseModel, Field, field_validator
try:
    import email_validator  # noqa: F401
    from pydantic import EmailStr as EmailType
except Exception:
    EmailType = str
from datetime import datetime
from utils.validation import sanitize_text, normalize_email, validate_phone

class UserBase(BaseModel):
    """Base user model with common fields."""
    name: str = Field(..., min_length=1, max_length=255, description="User's full name")
    email: EmailType = Field(..., description="User's email address")
    phone: Optional[str] = Field(None, max_length=50, description="User's phone number")

    @field_validator('name')
    def validate_name(cls, v):
        return sanitize_text(v)

    @field_validator('email')
    def validate_email_field(cls, v):
        return normalize_email(v)

    @field_validator('phone')
    def validate_phone_field(cls, v):
        return validate_phone(v)


class UserCreate(UserBase):
    """Model for creating a new user during registration."""
    pass


class UserResponse(UserBase):
    """Model for user data in API responses."""
    id: str = Field(..., description="Unique user identifier")
    image_url: Optional[str] = Field(None, description="URL to user's face image")
    registered_at: datetime = Field(..., description="Registration timestamp")
    
    class Config:
        from_attributes = True


class RegistrationRequest(BaseModel):
    """Model for registration request data (excluding image file)."""
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailType
    password: str = Field(..., min_length=6)
    phone: Optional[str] = Field(None, max_length=50)
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None
    id_number: Optional[str] = None

    @field_validator('name')
    def validate_name(cls, v):
        return sanitize_text(v)

    @field_validator('email')
    def validate_email_field(cls, v):
        return normalize_email(v)

    @field_validator('phone')
    def validate_phone_field(cls, v):
        return validate_phone(v)


class RegistrationResponse(BaseModel):
    """Model for registration response."""
    success: bool
    user_id: Optional[str] = None
    message: str


class RecognitionResponse(BaseModel):
    """Model for recognition response."""
    recognized: bool
    user: Optional[UserResponse] = None
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="Match confidence score")
    message: Optional[str] = None


class ErrorResponse(BaseModel):
    """Model for error responses."""
    success: bool = False
    error: dict = Field(..., description="Error details")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": False,
                "error": {
                    "code": "NO_FACE_DETECTED",
                    "message": "No face detected in image",
                    "details": {}
                }
            }
        }
