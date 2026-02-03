"""
Authentication related Pydantic models.
"""
from pydantic import BaseModel, Field, field_validator
try:
    import email_validator  # noqa: F401
    from pydantic import EmailStr as EmailType
except Exception:
    EmailType = str
from utils.validation import normalize_email

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
