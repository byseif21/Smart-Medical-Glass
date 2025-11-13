"""
Face recognition service for Smart Glass AI system.
Handles face encoding extraction, storage, and matching.
"""

import face_recognition
import numpy as np
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
import os
from pathlib import Path
import threading

from ..models.face_encoding import (
    FaceExtractionResult,
    FaceMatch,
    FaceEncodingWithMetadata,
    FaceEncodingStorage
)
from ..utils.image_processor import ImageProcessor, ImageProcessingError
from ..utils.config import config


class FaceRecognitionError(Exception):
    """Custom exception for face recognition errors."""
    pass


class FaceRecognitionService:
    """Service for face recognition operations."""
    
    def __init__(self):
        """Initialize the face recognition service."""
        self.tolerance = config.FACE_RECOGNITION_TOLERANCE
        self.encodings_file = Path(config.LOCAL_ENCODINGS_PATH)
        self._lock = threading.Lock()  # For thread-safe file operations
        
        # Ensure data directory exists
        self.encodings_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Initialize encodings file if it doesn't exist
        if not self.encodings_file.exists():
            self._initialize_encodings_file()
    
    def _initialize_encodings_file(self) -> None:
        """Initialize empty encodings file."""
        initial_data = FaceEncodingStorage(encodings=[], last_updated=datetime.utcnow())
        with open(self.encodings_file, 'w') as f:
            json.dump(initial_data.model_dump(mode='json'), f, indent=2, default=str)
    
    def extract_encoding(self, image_bytes: bytes) -> FaceExtractionResult:
        """
        Extract face encoding from image bytes.
        
        Args:
            image_bytes: Raw image bytes
            
        Returns:
            FaceExtractionResult with encoding or error information
        """
        try:
            # Preprocess image
            image = ImageProcessor.preprocess_image(image_bytes)
            
            # Detect face locations
            face_locations = face_recognition.face_locations(image)
            face_count = len(face_locations)
            
            # Handle no face detected
            if face_count == 0:
                return FaceExtractionResult(
                    success=False,
                    encoding=None,
                    error="No face detected in image",
                    face_count=0
                )
            
            # Handle multiple faces detected
            if face_count > 1:
                return FaceExtractionResult(
                    success=False,
                    encoding=None,
                    error=f"Multiple faces detected ({face_count}). Please upload image with single face",
                    face_count=face_count
                )
            
            # Extract face encoding
            face_encodings = face_recognition.face_encodings(image, face_locations)
            
            if len(face_encodings) == 0:
                return FaceExtractionResult(
                    success=False,
                    encoding=None,
                    error="Failed to extract face encoding",
                    face_count=face_count
                )
            
            # Convert numpy array to list for JSON serialization
            encoding = face_encodings[0].tolist()
            
            return FaceExtractionResult(
                success=True,
                encoding=encoding,
                error=None,
                face_count=1
            )
            
        except ImageProcessingError as e:
            return FaceExtractionResult(
                success=False,
                encoding=None,
                error=f"Image processing error: {str(e)}",
                face_count=0
            )
        except Exception as e:
            return FaceExtractionResult(
                success=False,
                encoding=None,
                error=f"Face extraction failed: {str(e)}",
                face_count=0
            )
    
    def save_encoding(
        self,
        user_id: str,
        encoding: List[float],
        user_data: Dict[str, Any]
    ) -> bool:
        """
        Save face encoding to local JSON storage.
        
        Args:
            user_id: Unique user identifier
            encoding: Face encoding vector
            user_data: Dictionary containing name and email
            
        Returns:
            True if save successful
            
        Raises:
            FaceRecognitionError: If save operation fails
        """
        try:
            with self._lock:
                # Load existing encodings
                storage = self._load_encodings_storage()
                
                # Create new encoding entry
                new_encoding = FaceEncodingWithMetadata(
                    user_id=user_id,
                    encoding=encoding,
                    name=user_data.get('name', ''),
                    email=user_data.get('email', ''),
                    timestamp=datetime.utcnow()
                )
                
                # Check if user already exists (update instead of duplicate)
                existing_index = None
                for i, enc in enumerate(storage.encodings):
                    if enc.user_id == user_id:
                        existing_index = i
                        break
                
                if existing_index is not None:
                    # Update existing encoding
                    storage.encodings[existing_index] = new_encoding
                else:
                    # Add new encoding
                    storage.encodings.append(new_encoding)
                
                # Update last_updated timestamp
                storage.last_updated = datetime.utcnow()
                
                # Save to file
                with open(self.encodings_file, 'w') as f:
                    json.dump(storage.model_dump(mode='json'), f, indent=2, default=str)
                
                return True
                
        except Exception as e:
            raise FaceRecognitionError(f"Failed to save encoding: {str(e)}")
    
    def load_encodings(self) -> List[FaceEncodingWithMetadata]:
        """
        Load all face encodings from local JSON storage.
        
        Returns:
            List of FaceEncodingWithMetadata objects
            
        Raises:
            FaceRecognitionError: If load operation fails
        """
        try:
            storage = self._load_encodings_storage()
            return storage.encodings
        except Exception as e:
            raise FaceRecognitionError(f"Failed to load encodings: {str(e)}")
    
    def _load_encodings_storage(self) -> FaceEncodingStorage:
        """
        Load encodings storage from file.
        
        Returns:
            FaceEncodingStorage object
        """
        if not self.encodings_file.exists():
            self._initialize_encodings_file()
        
        with open(self.encodings_file, 'r') as f:
            data = json.load(f)
            return FaceEncodingStorage(**data)
    
    def find_match(self, encoding: List[float]) -> FaceMatch:
        """
        Find matching face in stored encodings.
        
        Args:
            encoding: Face encoding vector to match
            
        Returns:
            FaceMatch object with match result
        """
        try:
            # Load all stored encodings
            stored_encodings = self.load_encodings()
            
            if not stored_encodings:
                return FaceMatch(
                    matched=False,
                    user_id=None,
                    confidence=None,
                    distance=None
                )
            
            # Convert encoding to numpy array
            encoding_array = np.array(encoding)
            
            # Prepare arrays for comparison
            known_encodings = [np.array(enc.encoding) for enc in stored_encodings]
            
            # Compare faces
            matches = face_recognition.compare_faces(
                known_encodings,
                encoding_array,
                tolerance=self.tolerance
            )
            
            # Calculate face distances
            face_distances = face_recognition.face_distance(known_encodings, encoding_array)
            
            # Find best match
            best_match_index = None
            best_distance = None
            
            for i, (match, distance) in enumerate(zip(matches, face_distances)):
                if match:
                    if best_match_index is None or distance < best_distance:
                        best_match_index = i
                        best_distance = distance
            
            # Return result
            if best_match_index is not None:
                matched_encoding = stored_encodings[best_match_index]
                # Convert distance to confidence (0 = perfect match, 1 = no match)
                # Confidence = 1 - (distance / tolerance)
                confidence = max(0.0, min(1.0, 1.0 - (best_distance / self.tolerance)))
                
                return FaceMatch(
                    matched=True,
                    user_id=matched_encoding.user_id,
                    confidence=confidence,
                    distance=float(best_distance)
                )
            else:
                return FaceMatch(
                    matched=False,
                    user_id=None,
                    confidence=None,
                    distance=None
                )
                
        except Exception as e:
            raise FaceRecognitionError(f"Face matching failed: {str(e)}")
    
    def get_encoding_count(self) -> int:
        """
        Get the number of stored encodings.
        
        Returns:
            Number of encodings
        """
        try:
            storage = self._load_encodings_storage()
            return len(storage.encodings)
        except Exception:
            return 0
    
    def delete_encoding(self, user_id: str) -> bool:
        """
        Delete encoding for a specific user.
        
        Args:
            user_id: User identifier
            
        Returns:
            True if deletion successful, False if user not found
        """
        try:
            with self._lock:
                storage = self._load_encodings_storage()
                
                # Filter out the user's encoding
                original_count = len(storage.encodings)
                storage.encodings = [
                    enc for enc in storage.encodings
                    if enc.user_id != user_id
                ]
                
                # Check if anything was deleted
                if len(storage.encodings) == original_count:
                    return False
                
                # Update timestamp and save
                storage.last_updated = datetime.utcnow()
                
                with open(self.encodings_file, 'w') as f:
                    json.dump(storage.model_dump(mode='json'), f, indent=2, default=str)
                
                return True
                
        except Exception as e:
            raise FaceRecognitionError(f"Failed to delete encoding: {str(e)}")


# Singleton instance
_face_service_instance: Optional[FaceRecognitionService] = None


def get_face_service() -> FaceRecognitionService:
    """
    Get or create the face recognition service singleton instance.
    
    Returns:
        FaceRecognitionService instance
    """
    global _face_service_instance
    if _face_service_instance is None:
        _face_service_instance = FaceRecognitionService()
    return _face_service_instance
