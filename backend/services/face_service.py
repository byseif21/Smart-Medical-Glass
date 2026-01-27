"""
Face recognition service for Smart Glass AI system.
Handles face encoding extraction, storage, and matching.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
import json
from pathlib import Path
import threading
from fastapi import UploadFile
import logging

from models.face_encoding import (
    FaceExtractionResult,
    FaceMatch,
    FaceEncodingWithMetadata,
    FaceEncodingStorage
)
from utils.config import config

logger = logging.getLogger(__name__)


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
            try:
                from utils.image_processor import ImageProcessor, ImageProcessingError
            except Exception as import_err:
                return FaceExtractionResult(
                    success=False,
                    encoding=None,
                    error=f"Image processing dependencies not available: {str(import_err)}",
                    face_count=0
                )
            image = ImageProcessor.preprocess_image(image_bytes)
            try:
                import face_recognition as fr
            except ImportError:
                return FaceExtractionResult(
                    success=False,
                    encoding=None,
                    error="face_recognition not installed",
                    face_count=0
                )
            face_locations = fr.face_locations(image)
            face_count = len(face_locations)
            if face_count == 0:
                return FaceExtractionResult(
                    success=False,
                    encoding=None,
                    error="No face detected in image",
                    face_count=0
                )
            if face_count > 1:
                return FaceExtractionResult(
                    success=False,
                    encoding=None,
                    error=f"Multiple faces detected ({face_count})",
                    face_count=face_count
                )
            face_encodings = fr.face_encodings(image, face_locations)
            if len(face_encodings) == 0:
                return FaceExtractionResult(
                    success=False,
                    encoding=None,
                    error="Failed to extract face encoding",
                    face_count=face_count
                )
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
                error=str(e),
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
            try:
                import face_recognition as fr
            except ImportError:
                return FaceMatch(
                    matched=False,
                    user_id=None,
                    confidence=None,
                    distance=None
                )
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
            import numpy as np
            encoding_array = np.array(encoding)
            
            # Prepare arrays for comparison
            known_encodings = [np.array(enc.encoding) for enc in stored_encodings]
            
            # Compare faces
            matches = fr.compare_faces(
                known_encodings,
                encoding_array,
                tolerance=self.tolerance
            )
            
            # Calculate face distances
            face_distances = fr.face_distance(known_encodings, encoding_array)
            
            # Find best match
            best_match_index = None
            best_distance = float('inf')
            
            # Find the absolute best match first (ignoring tolerance for now)
            for i, distance in enumerate(face_distances):
                if distance < best_distance:
                    best_distance = distance
                    best_match_index = i
            
            # Check if the best match is within tolerance
            if best_match_index is not None and best_distance <= self.tolerance:
                matched_encoding = stored_encodings[best_match_index]
                # Confidence = 1 - distance (Linear confidence)
                confidence = max(0.0, min(1.0, 1.0 - best_distance))
                
                return FaceMatch(
                    matched=True,
                    user_id=matched_encoding.user_id,
                    confidence=confidence,
                    distance=float(best_distance)
                )
            else:
                # Return the best candidate even if not matched, but marked as matched=False
                # This helps debugging or "near match" logic if needed
                return FaceMatch(
                    matched=False,
                    user_id=stored_encodings[best_match_index].user_id if best_match_index is not None else None,
                    confidence=max(0.0, min(1.0, 1.0 - best_distance)) if best_distance != float('inf') else 0.0,
                    distance=float(best_distance) if best_distance != float('inf') else None
                )
                
        except Exception as e:
            raise FaceRecognitionError(f"Face matching failed: {str(e)}")

    def compare_faces(self, encoding1: List[float], encoding2: List[float]) -> float:
        """
        Compare two face encodings and return the Euclidean distance.
        Lower distance means better match.
        
        Args:
            encoding1: First face encoding
            encoding2: Second face encoding
            
        Returns:
            float: Euclidean distance (0.0 to 1.0+)
        """
        try:
            import face_recognition as fr
            import numpy as np
            
            # Convert to numpy arrays if needed
            e1 = np.array(encoding1) if not isinstance(encoding1, np.ndarray) else encoding1
            e2 = np.array(encoding2) if not isinstance(encoding2, np.ndarray) else encoding2
            
            return float(fr.face_distance([e1], e2)[0])
        except Exception:
            # Fallback for errors or missing library
            return 1.0
    
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
    
    def process_face_images(self, images: Dict[str, bytes]) -> List[float]:
        """
        Process multiple face images, extract encodings, and calculate average.
        
        Args:
            images: Dictionary of angle -> image bytes
            
        Returns:
            List[float]: Average face encoding
            
        Raises:
            FaceRecognitionError: If processing fails or no faces detected
        """
        try:
            if not images:
                raise FaceRecognitionError("No images provided")

            encodings = []
            errors = []
            for angle, image_data in images.items():
                result = self.extract_encoding(image_data)
                if result.success and result.encoding is not None:
                    encodings.append(result.encoding)
                elif result.error:
                    errors.append(f"{angle}: {result.error}")
            
            if not encodings:
                error_msg = "; ".join(errors) if errors else "No face detected in any of the images"
                raise FaceRecognitionError(f"Face processing failed: {error_msg}")
            
            # Average the encodings
            import numpy as np
            avg_encoding = np.mean(encodings, axis=0)
            return avg_encoding.tolist()
            
        except FaceRecognitionError:
            raise
        except Exception as e:
            logger.error(f"Unexpected error in process_face_images: {e}", exc_info=True)
            raise FaceRecognitionError(f"Failed to process face images: {str(e)}")

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


def upload_face_images(supabase, user_id: str, images: Dict[str, bytes]) -> None:
    """
    Upload face images to Supabase storage and update database records.
    
    Args:
        supabase: Supabase service/client
        user_id: User identifier
        images: Dictionary of angle -> image bytes
    """
    for angle, image_data in images.items():
        try:
            file_path = f"{user_id}/{angle}.jpg"
            # Upload to storage (upsert=True to overwrite)
            supabase.client.storage.from_('face-images').upload(
                file_path,
                image_data,
                {"content-type": "image/jpeg", "upsert": "true"}
            )
            
            # Upsert image record
            # Delete existing first to ensure clean state
            supabase.client.table('face_images').delete().eq('user_id', user_id).eq('image_type', angle).execute()
            supabase.client.table('face_images').insert({
                "user_id": user_id,
                "image_url": file_path,
                "image_type": angle
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to upload {angle} image: {str(e)}")


async def collect_face_images(
    image: Optional[UploadFile] = None,
    image_front: Optional[UploadFile] = None,
    image_left: Optional[UploadFile] = None,
    image_right: Optional[UploadFile] = None,
    image_up: Optional[UploadFile] = None,
    image_down: Optional[UploadFile] = None,
) -> Dict[str, bytes]:
    """
    Collect and read bytes from uploaded face images.
    
    Args:
        image: Legacy single image (treated as 'front')
        image_front: Front face image
        image_left: Left face image
        image_right: Right face image
        image_up: Up face image
        image_down: Down face image
        
    Returns:
        Dictionary mapping angle to image bytes
    """
    face_images = {}
    if image:
        face_images['front'] = await image.read()
    if image_front:
        face_images['front'] = await image_front.read()
    if image_left:
        face_images['left'] = await image_left.read()
    if image_right:
        face_images['right'] = await image_right.read()
    if image_up:
        face_images['up'] = await image_up.read()
    if image_down:
        face_images['down'] = await image_down.read()
    
    return face_images

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
