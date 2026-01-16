"""
User data models for Smart Glass AI system.
"""

from typing import Optional
from pydantic import BaseModel, Field
try:
    import email_validator  # noqa: F401
    from pydantic import EmailStr as EmailType
except Exception:
    EmailType = str
from datetime import datetime


class UserBase(BaseModel):
    """Base user model with common fields."""
    name: str = Field(..., min_length=1, max_length=255, description="User's full name")
    email: EmailType = Field(..., description="User's email address")
    phone: Optional[str] = Field(None, max_length=50, description="User's phone number")


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
    phone: Optional[str] = Field(None, max_length=50)


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
