"""
Face encoding data models for Smart Glass AI system.
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class FaceEncoding(BaseModel):
    """Model for face encoding data."""
    user_id: str = Field(..., description="Associated user ID")
    encoding: List[float] = Field(..., description="128-dimensional face encoding vector")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "encoding": [0.123, -0.456, 0.789]  # Truncated for example
            }
        }


class FaceEncodingWithMetadata(FaceEncoding):
    """Face encoding with additional metadata."""
    name: str = Field(..., description="User's name for quick lookup")
    email: str = Field(..., description="User's email")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="When encoding was created")


class FaceEncodingStorage(BaseModel):
    """Model for local JSON storage of face encodings."""
    encodings: List[FaceEncodingWithMetadata] = Field(default_factory=list)
    last_updated: datetime = Field(default_factory=datetime.utcnow)


class FaceMatch(BaseModel):
    """Model for face matching result."""
    matched: bool
    user_id: Optional[str] = None
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    distance: Optional[float] = Field(None, ge=0.0, description="Face distance metric (lower is better)")


class FaceExtractionResult(BaseModel):
    """Model for face extraction result."""
    success: bool
    encoding: Optional[List[float]] = None
    error: Optional[str] = None
    face_count: int = Field(0, description="Number of faces detected in image")
