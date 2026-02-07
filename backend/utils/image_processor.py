"""
Image processing utilities for Smart Glass AI system.
Handles image loading, validation, and preprocessing.
"""

import io
from typing import Tuple, Optional, Any
from PIL import Image
from .config import config

try:
    import numpy as np
    import cv2
except ImportError:
    np = None
    cv2 = None


class ImageProcessingError(Exception):
    """Custom exception for image processing errors."""
    pass


class ImageProcessor:
    """Handles image processing operations for face recognition."""
    
    SUPPORTED_FORMATS = {'JPEG', 'PNG', 'JPG', 'WEBP'}
    MAX_DIMENSION = 800  # Maximum width or height in pixels
    
    @staticmethod
    def validate_image_format(image_bytes: bytes) -> bool:
        """
        Validate that the image is in a supported format (JPEG or PNG).
        
        Args:
            image_bytes: Raw image bytes
            
        Returns:
            True if format is valid
            
        Raises:
            ImageProcessingError: If format is invalid
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))
            format_name = image.format.upper() if image.format else None
            
            if format_name not in ImageProcessor.SUPPORTED_FORMATS:
                raise ImageProcessingError(
                    f"Invalid image format: {format_name}. "
                    f"Supported formats: {', '.join(ImageProcessor.SUPPORTED_FORMATS)}"
                )
            
            return True
        except Exception as e:
            if isinstance(e, ImageProcessingError):
                raise
            raise ImageProcessingError(f"Failed to validate image format: {str(e)}")
    
    @staticmethod
    def validate_image_size(image_bytes: bytes) -> bool:
        """
        Validate that the image size is within acceptable limits.
        
        Args:
            image_bytes: Raw image bytes
            
        Returns:
            True if size is valid
            
        Raises:
            ImageProcessingError: If size exceeds limit
        """
        max_size = config.get_max_image_size_bytes()
        actual_size = len(image_bytes)
        
        if actual_size > max_size:
            raise ImageProcessingError(
                f"Image size ({actual_size / (1024*1024):.2f} MB) exceeds "
                f"maximum allowed size ({config.MAX_IMAGE_SIZE_MB} MB)"
            )
        
        return True
    
    @staticmethod
    def optimize_for_network(image_bytes: bytes, max_size: int = 800, quality: int = 85) -> bytes:
        """
        Resize and compress image for fast network transfer (Redis/Celery).
        Converts to JPEG to reduce size significantly.
        
        Args:
            image_bytes: Raw input image bytes
            max_size: Max width/height
            quality: JPEG quality (1-100)
            
        Returns:
            Optimized image bytes (JPEG)
        """
        try:
            # Load with PIL (faster than CV2 for simple resize/save)
            img = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if needed (e.g. RGBA pngs)
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
                
            # Resize if too big
            if max(img.size) > max_size:
                img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                
            # Save to bytes
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=quality, optimize=True)
            return output.getvalue()
            
        except Exception as e:
            # If optimization fails, return original bytes (fail safe)
            return image_bytes

    @staticmethod
    def load_image_from_bytes(image_bytes: bytes):
        """
        Load image from bytes and convert to numpy array (RGB format).
        
        Args:
            image_bytes: Raw image bytes
            
        Returns:
            numpy array in RGB format
            
        Raises:
            ImageProcessingError: If image cannot be loaded
        """
        if np is None or cv2 is None:
            raise ImageProcessingError("Image decoding requires numpy and opencv")

        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if image is None:
                raise ImageProcessingError("Failed to decode image")
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            return image_rgb
        except Exception as e:
            if isinstance(e, ImageProcessingError):
                raise
            raise ImageProcessingError(f"Failed to load image: {str(e)}")
    
    @staticmethod
    def resize_image(image, max_dimension: int = MAX_DIMENSION):
        """
        Resize image while maintaining aspect ratio.
        Only resizes if image exceeds max_dimension.
        
        Args:
            image: numpy array (RGB format)
            max_dimension: Maximum width or height in pixels
            
        Returns:
            Resized numpy array
        """
        if np is None or cv2 is None:
            raise ImageProcessingError("Image resizing requires numpy and opencv")
             
        height, width = image.shape[:2]
        
        # Only resize if image exceeds max dimension
        if height <= max_dimension and width <= max_dimension:
            return image
        
        # Calculate scaling factor
        if height > width:
            scale = max_dimension / height
        else:
            scale = max_dimension / width
        
        new_width = int(width * scale)
        new_height = int(height * scale)
        
        # Resize using high-quality interpolation
        resized = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
        
        return resized
    
    @staticmethod
    def preprocess_image(image_bytes: bytes):
        """
        Complete preprocessing pipeline: validate, load, and resize image.
        
        Args:
            image_bytes: Raw image bytes
            
        Returns:
            Preprocessed numpy array in RGB format
            
        Raises:
            ImageProcessingError: If any preprocessing step fails
        """
        # Validate format
        ImageProcessor.validate_image_format(image_bytes)
        
        # Validate size
        ImageProcessor.validate_image_size(image_bytes)
        
        # Load image
        image = ImageProcessor.load_image_from_bytes(image_bytes)
        
        # Resize if needed
        image = ImageProcessor.resize_image(image)
        
        return image
    
    @staticmethod
    def get_image_dimensions(image) -> Tuple[int, int]:
        """
        Get image dimensions (width, height).
        
        Args:
            image: numpy array
            
        Returns:
            Tuple of (width, height)
        """
        height, width = image.shape[:2]
        return width, height

    @staticmethod
    def check_blur(image, threshold: float = 100.0) -> Tuple[bool, float]:
        """
        Check if image is blurry using Laplacian variance.
        
        Args:
            image: numpy array (RGB)
            threshold: Variance threshold (below this is considered blurry)
            
        Returns:
            Tuple of (is_blurry, variance_score)
        """
        if cv2 is None:
            return False, float('inf')  # Fail open

        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        # Calculate Laplacian variance
        variance = cv2.Laplacian(gray, cv2.CV_64F).var()
        return variance < threshold, variance


# Convenience functions for direct use
def validate_and_load_image(image_bytes: bytes) -> Any:
    """
    Validate and load image in one step.
    
    Args:
        image_bytes: Raw image bytes
        
    Returns:
        Preprocessed numpy array in RGB format
        
    Raises:
        ImageProcessingError: If validation or loading fails
    """
    return ImageProcessor.preprocess_image(image_bytes)


def is_valid_image(image_bytes: bytes) -> Tuple[bool, Optional[str]]:
    """
    Check if image is valid without raising exceptions.
    
    Args:
        image_bytes: Raw image bytes
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        ImageProcessor.validate_image_format(image_bytes)
        ImageProcessor.validate_image_size(image_bytes)
        return True, None
    except ImageProcessingError as e:
        return False, str(e)
