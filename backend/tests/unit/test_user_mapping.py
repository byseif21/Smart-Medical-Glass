
import sys
import os
import pytest
from datetime import datetime

# Add parent directory to path to allow importing backend modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Import models
from models.user import UserResponse
from models.admin import UserAdminView, UserUpdateRequest

@pytest.fixture
def db_record_active():
    return {
        'id': '123',
        'name': 'Test User',
        'email': 'active@test.com',
        'role': 'user',
        'is_active': True,
        'created_at': '2023-01-01T00:00:00Z',
        'last_login': None,
        'phone': None,
        'image_url': None
    }

@pytest.fixture
def db_record_inactive():
    return {
        'id': '456',
        'name': 'Banned User',
        'email': 'banned@test.com',
        'role': 'user',
        'is_active': False,
        'created_at': '2023-01-01T00:00:00Z',
        'last_login': None,
        'phone': None,
        'image_url': None
    }

def map_to_response(record):
    return UserResponse(
        id=record['id'],
        name=record['name'],
        email=record['email'],
        role=record.get('role', 'user'),
        is_active=record.get('is_active', True),
        phone=record.get('phone'),
        image_url=record.get('image_url'),
        registered_at=datetime.fromisoformat(record['created_at'].replace('Z', '+00:00'))
    )

def map_to_admin_view(record):
    return UserAdminView(
        id=record['id'],
        name=record['name'],
        email=record['email'],
        role=record.get('role', 'user'),
        is_active=record.get('is_active', True),
        created_at=record.get('created_at'),
        last_login=record.get('last_login')
    )

def test_user_response_active(db_record_active):
    """Test UserResponse mapping for an active user."""
    user_active = map_to_response(db_record_active)
    assert user_active.is_active is True

def test_user_response_inactive(db_record_inactive):
    """Test UserResponse mapping for an inactive user."""
    user_inactive = map_to_response(db_record_inactive)
    assert user_inactive.is_active is False

def test_admin_view_inactive(db_record_inactive):
    """Test UserAdminView mapping for an inactive user."""
    admin_view_inactive = map_to_admin_view(db_record_inactive)
    assert admin_view_inactive.is_active is False

def test_user_update_request():
    """Test UserUpdateRequest model."""
    update_req = UserUpdateRequest(is_active=False)
    assert update_req.is_active is False
