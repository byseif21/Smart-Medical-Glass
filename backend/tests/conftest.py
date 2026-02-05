
import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
import os
import sys

# Add backend to path to ensure imports work
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app

@pytest.fixture(scope="module")
def client():
    """
    Fixture for FastAPI TestClient.
    Mocks startup dependencies to prevent real database connections during tests.
    """
    # Mock the startup event dependencies
    with patch("services.storage_service.get_supabase_service") as mock_get_supabase, \
         patch("utils.migrations.run_migrations_on_startup") as mock_migrations:
        
        # Configure the mock to avoid errors during startup
        mock_service = MagicMock()
        mock_service.client = MagicMock()
        mock_get_supabase.return_value = mock_service
        
        with TestClient(app) as c:
            yield c
