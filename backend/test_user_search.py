"""
Test script for user search endpoint
Run this after starting the backend server with: uvicorn main:app --reload
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_user_search():
    """Test the user search endpoint"""
    
    print("Testing User Search Endpoint")
    print("=" * 50)
    
    # Test 1: Search with valid query
    print("\n1. Testing search with query 'john'...")
    try:
        response = requests.get(f"{BASE_URL}/api/users/search?q=john")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {str(e)}")
    
    # Test 2: Search with minimum length query
    print("\n2. Testing search with minimum length query 'ab'...")
    try:
        response = requests.get(f"{BASE_URL}/api/users/search?q=ab")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {str(e)}")
    
    # Test 3: Search with too short query (should fail)
    print("\n3. Testing search with too short query 'a' (should fail)...")
    try:
        response = requests.get(f"{BASE_URL}/api/users/search?q=a")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {str(e)}")
    
    # Test 4: Search with current_user_id to exclude
    print("\n4. Testing search with current_user_id exclusion...")
    try:
        # First get a user ID
        response = requests.get(f"{BASE_URL}/api/users/search?q=test")
        if response.status_code == 200 and response.json()['users']:
            user_id = response.json()['users'][0]['id']
            print(f"Found user ID: {user_id}")
            
            # Now search excluding that user
            response = requests.get(f"{BASE_URL}/api/users/search?q=test&current_user_id={user_id}")
            print(f"Status Code: {response.status_code}")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            print(f"User {user_id} should not be in results")
    except Exception as e:
        print(f"Error: {str(e)}")
    
    # Test 5: Search by ID
    print("\n5. Testing search by user ID...")
    try:
        # Get a user first
        response = requests.get(f"{BASE_URL}/api/users/search?q=test")
        if response.status_code == 200 and response.json()['users']:
            user_id = response.json()['users'][0]['id']
            # Search by partial ID
            partial_id = user_id[:8]
            print(f"Searching for partial ID: {partial_id}")
            
            response = requests.get(f"{BASE_URL}/api/users/search?q={partial_id}")
            print(f"Status Code: {response.status_code}")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {str(e)}")
    
    print("\n" + "=" * 50)
    print("Testing complete!")

if __name__ == "__main__":
    test_user_search()
