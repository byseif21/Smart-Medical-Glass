"""
Service modules for Smart Glass AI backend.
"""

from .face_service import (
    FaceRecognitionService,
    FaceRecognitionError,
    get_face_service
)

__all__ = [
    'FaceRecognitionService',
    'FaceRecognitionError',
    'get_face_service'
]
