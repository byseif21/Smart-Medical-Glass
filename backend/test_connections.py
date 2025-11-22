"""
Test script for connections endpoints
Run this after starting the backend server
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_create_linked_connection():
    """Test creating a linked connection"""
    print("\n=== Testing Create Linked Connection ===")
    
    # Note: You'll need valid user IDs and a JWT token for this to work
    # This is a template for testing
    
    url = f"{BASE_URL}/api/connections/linked"
    headers = {
        "Authorization": "Bearer YOUR_JWT_TOKEN_HERE",
        "Content-Type": "application/json"
    }
    data = {
        "connected_user_id": "USER_ID_TO_CONNECT",
        "relationship": "Friend"
    }
    
    print(f"POST {url}")
    print(f"Data: {json.dumps(data, indent=2)}")
    print("\nNote: Replace YOUR_JWT_TOKEN_HERE and USER_ID_TO_CONNECT with actual values")
    
    # Uncomment to actually make the request:
    # response = requests.post(url, headers=headers, json=data)
    # print(f"Status: {response.status_code}")
    # print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_get_connections():
    """Test getting all connections for a user"""
    print("\n=== Testing Get All Connections ===")
    
    user_id = "YOUR_USER_ID_HERE"
    url = f"{BASE_URL}/api/connections/{user_id}"
    
    print(f"GET {url}")
    print("\nNote: Replace YOUR_USER_ID_HERE with an actual user ID")
    
    # Uncomment to actually make the request:
    # response = requests.get(url)
    # print(f"Status: {response.status_code}")
    # print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_create_external_contact():
    """Test creating an external contact"""
    print("\n=== Testing Create External Contact ===")
    
    url = f"{BASE_URL}/api/connections/external"
    headers = {
        "Authorization": "Bearer YOUR_JWT_TOKEN_HERE",
        "Content-Type": "application/json"
    }
    data = {
        "name": "John Doe",
        "phone": "+1234567890",
        "address": "123 Main St, City, State",
        "relationship": "Father"
    }
    
    print(f"POST {url}")
    print(f"Data: {json.dumps(data, indent=2)}")
    print("\nNote: Replace YOUR_JWT_TOKEN_HERE with actual JWT token")
    
    # Uncomment to actually make the request:
    # response = requests.post(url, headers=headers, json=data)
    # print(f"Status: {response.status_code}")
    # print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_validation_errors():
    """Test validation scenarios"""
    print("\n=== Testing Validation Scenarios ===")
    
    print("\nLinked Connections:")
    print("1. Invalid relationship type:")
    print("   Should return 400 with error message")
    
    print("\n2. Self-connection attempt:")
    print("   Should return 400 with 'Cannot create a connection to yourself'")
    
    print("\n3. Non-existent user:")
    print("   Should return 404 with 'Connected user not found'")
    
    print("\n4. Duplicate connection:")
    print("   Should return 409 with 'Connection already exists'")
    
    print("\nExternal Contacts:")
    print("5. Missing required name:")
    print("   Should return 422 validation error")
    
    print("\n6. Missing required phone:")
    print("   Should return 422 validation error")
    
    print("\n7. Invalid phone format:")
    print("   Should return 400 with 'Invalid phone number format'")
    
    print("\n8. Invalid relationship type:")
    print("   Should return 400 with error message")

if __name__ == "__main__":
    print("=" * 60)
    print("Connections API Test Script")
    print("=" * 60)
    
    print("\nEndpoints implemented:")
    print("1. POST /api/connections/linked - Create bidirectional connection")
    print("2. POST /api/connections/external - Create external contact")
    print("3. GET /api/connections/{user_id} - Get all connections")
    
    test_create_linked_connection()
    test_create_external_contact()
    test_get_connections()
    test_validation_errors()
    
    print("\n" + "=" * 60)
    print("To test these endpoints:")
    print("1. Start the backend server: cd backend && uvicorn main:app --reload")
    print("2. Login to get a JWT token")
    print("3. Update this script with real values")
    print("4. Uncomment the request lines and run: python test_connections.py")
    print("=" * 60)
