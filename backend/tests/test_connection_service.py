import unittest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
import sys
import os

# Add parent directory to path to allow importing backend modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.connection_service import ConnectionService
from models.connections import (
    CreateLinkedConnectionRequest,
    CreateExternalContactRequest
)
from utils.validation import ValidationError

class TestConnectionService(unittest.IsolatedAsyncioTestCase):
    
    def setUp(self):
        # Mock the SupabaseService
        self.mock_supabase = MagicMock()
        self.mock_client = MagicMock()
        self.mock_supabase.client = self.mock_client
        
        # Patch get_supabase_service
        self.patcher = patch('services.connection_service.get_supabase_service', return_value=self.mock_supabase)
        self.mock_get_service = self.patcher.start()
        
        self.service = ConnectionService()
        
    def tearDown(self):
        self.patcher.stop()

    def test_validate_relationship_valid(self):
        self.assertTrue(self.service.validate_relationship("Friend"))
        self.assertTrue(self.service.validate_relationship("Father"))

    def test_validate_relationship_invalid(self):
        self.assertFalse(self.service.validate_relationship("Alien"))
        self.assertFalse(self.service.validate_relationship(""))

    def test_validate_name_valid(self):
        # Should not raise exception
        self.service._validate_name("John Doe")

    def test_validate_name_invalid(self):
        with self.assertRaises(HTTPException) as cm:
            self.service._validate_name("J")
        self.assertEqual(cm.exception.status_code, 400)
        
        with self.assertRaises(HTTPException) as cm:
            self.service._validate_name("   ")
        self.assertEqual(cm.exception.status_code, 400)

    def test_validate_phone_valid(self):
        # Mock validate_phone from utils.validation to succeed
        with patch('services.connection_service.validate_phone') as mock_val:
            self.service._validate_phone("+1234567890")
            mock_val.assert_called_once()

    def test_validate_phone_invalid(self):
         # Mock validate_phone from utils.validation to fail
        with patch('services.connection_service.validate_phone', side_effect=ValidationError("Invalid")):
            with self.assertRaises(HTTPException) as cm:
                 self.service._validate_phone("invalid-phone")
            self.assertEqual(cm.exception.status_code, 400)

    def test_check_self_connection(self):
        with self.assertRaises(HTTPException) as cm:
            self.service._check_self_connection("user1", "user1")
        self.assertEqual(cm.exception.status_code, 400)
        
        # Should pass
        self.service._check_self_connection("user1", "user2")

    async def test_create_connection_request_success(self):
        sender_id = "user1"
        req = CreateLinkedConnectionRequest(
            connected_user_id="user2",
            relationship="Friend"
        )
        
        # Setup mock for all table()...execute() chains
        mock_query_builder = MagicMock()
        self.mock_client.table.return_value = mock_query_builder
        
        # Default behavior: return empty data (no conflicts)
        mock_response = MagicMock()
        mock_response.data = []
        
        # Configure select/insert/update/delete chains to return the mock response
        mock_query_builder.select.return_value = mock_query_builder
        mock_query_builder.insert.return_value = mock_query_builder
        mock_query_builder.update.return_value = mock_query_builder
        mock_query_builder.delete.return_value = mock_query_builder
        mock_query_builder.eq.return_value = mock_query_builder
        mock_query_builder.execute.return_value = mock_response
        
        # For the final insert, return the new request ID
        def side_effect(*args, **kwargs):
            # Check if this is the insert call (simplified check)
            if mock_query_builder.insert.called:
                return MagicMock(data=[{"id": "req-123"}])
            return MagicMock(data=[])
            
        mock_query_builder.execute.side_effect = side_effect
        
        # We can set side_effect on execute()
        mock_execute = MagicMock()
        mock_query_builder.execute = mock_execute
        
        # We expect 4 execute calls.
        # 1. _ensure_no_existing_connection (select)
        # 2. _check_incoming_request (select)
        # 3. _check_and_handle_outgoing_request (select)
        # 4. insert
        
        # Note: Order depends on implementation details.
        # Implementation:
        # self._validate_relationship_input(relationship)
        # self._check_self_connection(sender_id, receiver_id)
        # self._ensure_no_existing_connection(sender_id, receiver_id)  <-- Query 1
        # self._check_incoming_request(sender_id, receiver_id)         <-- Query 2
        # existing_result = await self._check_and_handle_outgoing_request(...) <-- Query 3
        # new_req = self.supabase.client.table('connection_requests').insert(...) <-- Query 4
        
        mock_execute.side_effect = [
            MagicMock(data=[]), # 1. No existing connection
            MagicMock(data=[]), # 2. No incoming request
            MagicMock(data=[]), # 3. No outgoing request
            MagicMock(data=[{"id": "req-123"}]) # 4. Insert result
        ]
        
        # We also need to mock chain methods to return self (builder pattern)
        mock_query_builder.select.return_value = mock_query_builder
        mock_query_builder.eq.return_value = mock_query_builder
        mock_query_builder.insert.return_value = mock_query_builder
        
        response = await self.service.create_connection_request(sender_id, req)
        
        self.assertTrue(response.success)
        self.assertEqual(response.request_id, "req-123")

    async def test_create_external_contact_success(self):
        user_id = "user1"
        req = CreateExternalContactRequest(
            name="Emergency Doc",
            phone="+15551234567",
            relationship="Doctor",
            address="123 Hospital Way"
        )
        
        mock_query_builder = MagicMock()
        self.mock_client.table.return_value = mock_query_builder
        
        # Mock chain
        mock_query_builder.insert.return_value = mock_query_builder
        mock_query_builder.execute.return_value = MagicMock(data=[{"id": "ext-123"}])
        
        with patch('services.connection_service.validate_phone'):
            response = await self.service.create_external_contact(user_id, req)
            
        self.assertTrue(response.success)
        self.assertEqual(response.contact_id, "ext-123")

    async def test_delete_connection_permission_denied(self):
        connection_id = "conn-123"
        user_id = "user1" # Current user
        other_user = "user2" # Owner of connection
        
        mock_query_builder = MagicMock()
        self.mock_client.table.return_value = mock_query_builder
        
        # Mock finding the connection, but owned by someone else
        connection_data = {
            "id": connection_id,
            "user_id": other_user,
            "connected_user_id": "user3"
        }
        
        # Mock select return
        mock_query_builder.select.return_value = mock_query_builder
        mock_query_builder.eq.return_value = mock_query_builder
        mock_query_builder.execute.return_value = MagicMock(data=[connection_data])
        
        with self.assertRaises(HTTPException) as cm:
            await self.service.delete_connection(connection_id, user_id)
            
        self.assertEqual(cm.exception.status_code, 403)
        self.assertIn("permission", cm.exception.detail)

if __name__ == '__main__':
    unittest.main()
