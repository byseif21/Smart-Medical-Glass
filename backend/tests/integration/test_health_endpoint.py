from unittest.mock import MagicMock, patch

def test_health_check_endpoint(client):
    """Test the health check endpoint returns 200 and correct structure."""
    
    # Mock the services used inside the endpoint
    with patch("services.face_service.get_face_service") as mock_get_face, \
         patch("services.storage_service.get_supabase_service") as mock_get_supabase:
        
        # Setup mocks
        mock_face_service = MagicMock()
        mock_face_service.get_encoding_count.return_value = 42
        mock_face_service.tolerance = 0.6
        mock_get_face.return_value = mock_face_service
        
        mock_supabase_service = MagicMock()
        mock_supabase_service.get_health_status.return_value = {
            "status": "connected",
            "connected": True,
            "url": "https://example.supabase.co"
        }
        mock_get_supabase.return_value = mock_supabase_service
        
        # Make request
        response = client.get("/api/health")
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "services" in data
        
        # Check Face Service details
        face_info = data["services"]["face_recognition"]
        assert face_info["status"] == "operational"
        assert face_info["details"]["encodings_stored"] == 42
        
        # Check Supabase Service details
        supabase_info = data["services"]["supabase"]
        assert supabase_info["status"] == "connected"
        assert supabase_info["details"]["connected"] is True
