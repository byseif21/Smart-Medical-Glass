import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.user_service import apply_privacy_settings

class TestPrivacySettings(unittest.TestCase):
    def setUp(self):
        self.user_public = {
            "id": "123",
            "name": "John Doe",
            "is_name_public": True,
            "is_email_public": True,
            "email": "john@example.com",
            "phone": "1234567890"
        }
        self.user_private = {
            "id": "456",
            "name": "Jane Doe",
            "is_name_public": False, # Private account
            "is_email_public": True, # Should be ignored because account is private
            "email": "jane@example.com",
            "phone": "0987654321"
        }

    def test_public_user_viewed_by_stranger(self):
        result = apply_privacy_settings(self.user_public, "user")
        self.assertEqual(result["name"], "John Doe")
        self.assertEqual(result["email"], "john@example.com")
        self.assertIsNone(result["phone"]) # Default is private

    def test_private_user_viewed_by_stranger(self):
        result = apply_privacy_settings(self.user_private, "user")
        self.assertEqual(result["name"], "Private Account")
        self.assertIsNone(result["email"]) # Should be hidden despite is_email_public=True
        self.assertIsNone(result["phone"])

    def test_private_user_viewed_by_doctor(self):
        result = apply_privacy_settings(self.user_private, "doctor")
        self.assertEqual(result["name"], "Jane Doe")
        # Note: Current implementation of apply_privacy_settings doesn't strictly check for None 
        # on fields that exist in dict but aren't in privacy logic? 
        # Wait, apply_privacy_settings returns a NEW dict with specific keys.
        # If 'email' is in the input, it's included if show_email is True.
        # Doctors are privileged, so show_email is True.
        self.assertEqual(result["email"], "jane@example.com")
        self.assertEqual(result["phone"], "0987654321")

if __name__ == '__main__':
    unittest.main()
