"""
Face recognition service for Smart Glass AI system.
Handles face encoding extraction, storage, and matching.
"""

from typing import List, Optional, Dict, Any, Tuple
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
        self._lock = threading.Lock()  # For thread-safe operations

    def validate_face_quality(self, image, face_location) -> Tuple[bool, str]:
        """
        Validate face image quality (size, blur, etc.) to prevent simple spoofs.
        
        Args:
            image: Numpy array of the full image
            face_location: Tuple of (top, right, bottom, left)
            
        Returns:
            Tuple of (is_valid, reason)
        """
        top, right, bottom, left = face_location
        face_height = bottom - top
        face_width = right - left
        
        # Check 1: Minimum Face Size (80x80px)
        # Prevents long-distance spoofs or small phone screens
        MIN_FACE_SIZE = 80
        if face_height < MIN_FACE_SIZE or face_width < MIN_FACE_SIZE:
            return False, f"Face too small ({face_width}x{face_height}px). Minimum {MIN_FACE_SIZE}x{MIN_FACE_SIZE}px required."

        # Check 2: Blur Detection on the face crop
        try:
            from utils.image_processor import ImageProcessor
            # Add some padding for context if possible, but keep it tight to the face
            face_crop = image[top:bottom, left:right]
            is_blurry, variance = ImageProcessor.check_blur(face_crop, threshold=100.0)
            
            if is_blurry:
                return False, f"Face image too blurry (Score: {variance:.1f}). Please hold steady."
        except Exception as e:
            logger.warning(f"Blur check failed: {e}")
            # Fail open if check fails, or log warning
            pass
            
        return True, "Quality checks passed"
    
    def extract_encoding(self, image_bytes: bytes) -> FaceExtractionResult:
        """
        Extract face encoding from image bytes.
        """
        try:
            from utils.image_processor import ImageProcessor, ImageProcessingError
            import face_recognition as fr
        except ImportError as e:
            return FaceExtractionResult(
                success=False, encoding=None, 
                error=f"Missing dependencies: {str(e)}", face_count=0
            )

        try:
            image = ImageProcessor.preprocess_image(image_bytes)
            return self._detect_and_encode(image, fr)
        except ImageProcessingError as e:
            return FaceExtractionResult(
                success=False, encoding=None, error=str(e), face_count=0
            )
        except Exception as e:
            logger.error(f"Encoding extraction failed: {e}")
            return FaceExtractionResult(
                success=False, encoding=None, error="Internal processing error", face_count=0
            )

    def _detect_and_encode(self, image, fr) -> FaceExtractionResult:
        face_locations = fr.face_locations(image)
        face_count = len(face_locations)
        
        if face_count == 0:
            return FaceExtractionResult(
                success=False, encoding=None, error="No face detected in image", face_count=0
            )
        if face_count > 1:
            return FaceExtractionResult(
                success=False, encoding=None, 
                error=f"Multiple faces detected ({face_count})", face_count=face_count
            )
            
        # Quality Check
        is_valid, quality_reason = self.validate_face_quality(image, face_locations[0])
        if not is_valid:
             return FaceExtractionResult(
                 success=False, encoding=None, 
                 error=f"Quality check failed: {quality_reason}", face_count=face_count
             )

        face_encodings = fr.face_encodings(image, face_locations)
        if not face_encodings:
             return FaceExtractionResult(
                 success=False, encoding=None, error="Failed to extract face encoding", face_count=face_count
             )
             
        return FaceExtractionResult(
            success=True, encoding=face_encodings[0].tolist(), 
            error=None, face_count=1
        )

    def save_encoding(
        self,
        user_id: str,
        encoding: List[float],
        user_data: Dict[str, Any]
    ) -> bool:
        """
        Save face encoding to Supabase database.
        
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
            from services.storage_service import get_supabase_service
            supabase = get_supabase_service()
            
            # Serialize encoding to JSON string
            encoding_json = json.dumps(encoding)
            
            # Update user record in Supabase
            response = supabase.client.table('users').update({
                'face_encoding': encoding_json,
                'face_updated_at': datetime.utcnow().isoformat()
            }).eq('id', user_id).execute()
            
            return True
                
        except Exception as e:
            raise FaceRecognitionError(f"Failed to save encoding: {str(e)}")
    
    def load_encodings(self) -> List[FaceEncodingWithMetadata]:
        """
        Load all face encodings from Supabase database.
        
        Returns:
            List of FaceEncodingWithMetadata objects
            
        Raises:
            FaceRecognitionError: If load operation fails
        """
        try:
            from services.storage_service import get_supabase_service
            supabase = get_supabase_service()
            
            # Fetch users with encodings
            # We only need minimal fields for recognition
            response = supabase.client.table('users').select(
                'id, name, email, face_encoding, face_updated_at'
            ).not_.is_('face_encoding', 'null').execute()
            
            encodings = []
            for user in response.data:
                try:
                    # Parse JSON encoding
                    if not user.get('face_encoding'):
                        continue
                        
                    encoding_vector = json.loads(user['face_encoding'])
                    
                    # Create metadata object
                    encodings.append(FaceEncodingWithMetadata(
                        user_id=user['id'],
                        encoding=encoding_vector,
                        name=user.get('name', 'Unknown'),
                        email=user.get('email', ''),
                        timestamp=datetime.fromisoformat(user['face_updated_at'].replace('Z', '+00:00')) if user.get('face_updated_at') else datetime.utcnow()
                    ))
                except (json.JSONDecodeError, ValueError) as e:
                    logger.warning(f"Skipping invalid encoding for user {user.get('id')}: {e}")
                    continue
            
            return encodings
            
        except Exception as e:
            raise FaceRecognitionError(f"Failed to load encodings: {str(e)}")
    
    def find_match(self, encoding: List[float]) -> FaceMatch:
        """
        Find matching face in stored encodings.
        """
        try:
            import face_recognition as fr
            import numpy as np
        except ImportError:
            return FaceMatch(matched=False, user_id=None, confidence=None, distance=None)

        stored_encodings = self.load_encodings()
        if not stored_encodings:
            return FaceMatch(matched=False, user_id=None, confidence=None, distance=None)

        # Prepare data
        try:
            encoding_array = np.array(encoding)
            known_encodings = [np.array(enc.encoding) for enc in stored_encodings]

            # Calculate distances (vectorized operation is faster)
            face_distances = fr.face_distance(known_encodings, encoding_array)
            
            # Find best match
            best_match_index = np.argmin(face_distances)
            best_distance = face_distances[best_match_index]

            # Determine if it's a match
            is_match = best_distance <= self.tolerance
            confidence = max(0.0, min(1.0, 1.0 - best_distance))

            return FaceMatch(
                matched=bool(is_match),
                user_id=stored_encodings[best_match_index].user_id if stored_encodings else None,
                confidence=float(confidence),
                distance=float(best_distance)
            )
        except Exception as e:
            logger.error(f"Face matching calculation failed: {e}")
            raise FaceRecognitionError(f"Face matching failed: {str(e)}")

    async def enroll_user(self, user_id: str, images: Dict[str, bytes], supabase) -> None:
        """
        Full enrollment process: process images, save encoding, and upload images.
        """
        # 1. Process images to get average encoding
        avg_encoding = self.process_face_images(images)

        # 2. Save encoding to DB
        # This updates the users table with the new encoding
        self.save_encoding(user_id, avg_encoding, {})

        # 3. Upload images to storage
        # We call the standalone function or logic here. 
        # Ideally, we move the upload logic into this class or keep using the helper.
        # Since upload_face_images is outside, we call it.
        upload_face_images(supabase, user_id, images)


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
        Get the number of stored encodings in Supabase.
        
        Returns:
            Number of encodings
        """
        try:
            from services.storage_service import get_supabase_service
            supabase = get_supabase_service()
            
            response = supabase.client.table('users').select('id', count='exact').not_.is_('face_encoding', 'null').execute()
            return response.count or 0
        except Exception:
            return 0
    
    def process_face_images(self, images: Dict[str, bytes]) -> List[float]:
        """
        Process multiple face images, extract encodings, and calculate average.
        """
        if not images:
            raise FaceRecognitionError("No images provided")

        encodings = []
        errors = []
        
        try:
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
        Delete encoding for a specific user from Supabase.
        
        Args:
            user_id: User identifier
            
        Returns:
            True if deletion successful, False if user not found
        """
        try:
            from services.storage_service import get_supabase_service
            supabase = get_supabase_service()
            
            # Set face_encoding to NULL
            response = supabase.client.table('users').update({
                'face_encoding': None
            }).eq('id', user_id).execute()
            
            return True
                
        except Exception as e:
            raise FaceRecognitionError(f"Failed to delete encoding: {str(e)}")

    def crop_face(self, image_bytes: bytes, padding_top: float = 0.8, padding_bottom: float = 0.4, padding_side: float = 0.5) -> Optional[bytes]:
        """
        Detect and crop face from image bytes with smart asymmetric padding.
        Prioritizes keeping hair (more top padding) and neck (bottom padding).
        
        Args:
            image_bytes: Raw image bytes
            padding_top: Padding above face (relative to face height). Default 0.8 for hair.
            padding_bottom: Padding below face. Default 0.4 for neck.
            padding_side: Padding on sides. Default 0.5 for ears/width.
            
        Returns:
            Optional[bytes]: Cropped image bytes or None
        """
        try:
            import face_recognition as fr
            from PIL import Image
            import io
            import numpy as np

            image = fr.load_image_file(io.BytesIO(image_bytes))
            face_locations = fr.face_locations(image)
            
            # strictly 1 face for the profile image
            if len(face_locations) != 1:
                return None
            
            # face_locations gives (top, right, bottom, left)
            top, right, bottom, left = face_locations[0]
            
            height = bottom - top
            width = right - left
            
            pad_top_px = int(height * padding_top)
            pad_bottom_px = int(height * padding_bottom)
            pad_side_px = int(width * padding_side)
            
            img_h, img_w, _ = image.shape
            
            # Expand box within image boundaries
            new_top = max(0, top - pad_top_px)
            new_bottom = min(img_h, bottom + pad_bottom_px)
            new_left = max(0, left - pad_side_px)
            new_right = min(img_w, right + pad_side_px)
            
            face_image = image[new_top:new_bottom, new_left:new_right]
            pil_image = Image.fromarray(face_image)
            
            output = io.BytesIO()
            pil_image.save(output, format="JPEG", quality=95)
            return output.getvalue()
            
        except Exception as e:
            logger.error(f"Error cropping face: {e}")
            return None


def upload_face_images(supabase, user_id: str, images: Dict[str, bytes]) -> None:
    """
    Upload face images to Supabase storage and update database records.
    Automatically crops faces before uploading to ensure only face data is stored.
    
    Args:
        supabase: Supabase service/client
        user_id: User identifier
        images: Dictionary of angle -> image bytes
    """
    face_service = get_face_service()
    
    for angle, image_data in images.items():
        try:
            # Attempt to crop the face to store only the face region
            cropped_data = face_service.crop_face(image_data)
            
            # cropped data if successful, otherwise fallback to original
            data_to_upload = cropped_data if cropped_data else image_data
            
            file_path = f"{user_id}/{angle}.jpg"
            # Upload to storage (upsert=True to overwrite)
            supabase.client.storage.from_('face-images').upload(
                file_path,
                data_to_upload,
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
    image_down: Optional[UploadFile] = None
) -> Dict[str, bytes]:
    """
    Collect and read bytes from uploaded face images.
    """
    face_images = {}
    
    # Map input args to angle names
    # Priority: image_front > image (legacy)
    inputs = {
        'front': image_front or image,
        'left': image_left,
        'right': image_right,
        'up': image_up,
        'down': image_down
    }

    for angle, file_obj in inputs.items():
        if file_obj:
            face_images[angle] = await file_obj.read()
            
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
