"""
Integration Test for Face Recognition Fallback Logic.

Validates the "Hybrid Architecture" for recognition:
1. "Fail Fast": Synchronous validation before background processing.
2. "Fallback": If background worker fails/times out, revert to local execution.
"""

import sys
import os
import pytest
from unittest.mock import MagicMock, patch
from fastapi import UploadFile, HTTPException

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from routers.recognition import recognize_face

@pytest.mark.asyncio
async def test_recognition_fail_fast_invalid_format():
    """Test that invalid image formats are rejected synchronously (Fail Fast)."""
    
    with patch('routers.recognition.get_config'), \
         patch('routers.recognition.ImageProcessor') as mock_processor:
        
        # Setup Mock Image
        async def mock_read_func():
            return b"fake_image_bytes"
            
        mock_image = MagicMock(spec=UploadFile)
        mock_image.read = mock_read_func

        # Setup Processor Mocks to RAISE error
        from utils.image_processor import ImageProcessingError
        mock_processor.validate_image_format.side_effect = ImageProcessingError("Invalid image format")

        # Expect HTTPException(400)
        with pytest.raises(HTTPException) as excinfo:
            await recognize_face(mock_image, {"sub": "user1", "role": "user"})
        
        assert excinfo.value.status_code == 400
        assert "Invalid image format" in excinfo.value.detail

@pytest.mark.skip(reason="Async worker temporarily disabled")
@pytest.mark.asyncio
async def test_recognition_fallback_on_timeout():
    """Test fallback to local execution when Celery task times out."""
    
    with patch('routers.recognition.get_config'), \
         patch('routers.recognition.get_current_user'), \
         patch('routers.recognition.recognize_face_task', new_callable=MagicMock) as mock_task, \
         patch('routers.recognition.ImageProcessor') as mock_processor, \
         patch('routers.recognition.get_face_service') as mock_get_service, \
         patch('routers.recognition.get_complete_user_profile') as mock_get_profile:

        # Setup Mock Image
        async def mock_read_func():
            return b"fake_image_bytes"
        mock_image = MagicMock(spec=UploadFile)
        mock_image.read = mock_read_func

        # Setup Valid Image
        mock_processor.validate_image_format.return_value = True
        mock_processor.validate_image_size.return_value = True
        
        # Mock optimize_for_network to return bytes (not MagicMock)
        mock_processor.optimize_for_network.side_effect = lambda img, **kwargs: img
        
        # Note: check_blur is no longer called in recognition.py

        # Setup Celery Mock to FAIL/TIMEOUT
        mock_async_result = MagicMock()
        mock_async_result.get.side_effect = Exception("Timeout waiting for task")
        mock_task.delay.return_value = mock_async_result

        # Setup Local Fallback Service Mock
        mock_face_service = MagicMock()
        mock_match_result = MagicMock()
        mock_match_result.matched = True
        mock_match_result.user_id = "found_user_id"
        mock_match_result.confidence = 0.98
        mock_face_service.identify_user.return_value = mock_match_result
        mock_get_service.return_value = mock_face_service
        
        # Setup Profile Mock
        mock_get_profile.return_value = {"id": "found_user_id", "name": "John Doe"}

        # Execute
        result = await recognize_face(mock_image, {"sub": "user1", "role": "user"})

        # Assertions
        mock_task.delay.assert_called_once()  # Celery attempted
        mock_face_service.identify_user.assert_called_with(b"fake_image_bytes")  # Fallback called
        
        assert result["success"] is True
        assert result["match"] is True
        assert result["name"] == "John Doe"

@pytest.mark.asyncio
async def test_recognition_direct_execution():
    """Test direct synchronous execution (current behavior)."""
    
    with patch('routers.recognition.get_config'), \
         patch('routers.recognition.get_current_user'), \
         patch('routers.recognition.ImageProcessor') as mock_processor, \
         patch('routers.recognition.get_face_service') as mock_get_service, \
         patch('routers.recognition.get_complete_user_profile') as mock_get_profile:

        # Setup Mock Image
        async def mock_read_func():
            return b"fake_image_bytes"
        mock_image = MagicMock(spec=UploadFile)
        mock_image.read = mock_read_func

        # Setup Valid Image
        mock_processor.validate_image_format.return_value = True
        mock_processor.validate_image_size.return_value = True
        
        # Setup Local Service Mock
        mock_face_service = MagicMock()
        mock_match_result = MagicMock()
        mock_match_result.matched = True
        mock_match_result.user_id = "found_user_id"
        mock_match_result.confidence = 0.99
        mock_face_service.identify_user.return_value = mock_match_result
        mock_get_service.return_value = mock_face_service
        
        # Setup Profile Mock
        mock_get_profile.return_value = {"id": "found_user_id", "name": "Jane Doe"}

        # Execute
        result = await recognize_face(mock_image, {"sub": "user1", "role": "user"})

        # Assertions
        mock_face_service.identify_user.assert_called_once()
        mock_face_service.identify_user.assert_called_with(b"fake_image_bytes")
        
        assert result["success"] is True
        assert result["match"] is True
        assert result["name"] == "Jane Doe"

