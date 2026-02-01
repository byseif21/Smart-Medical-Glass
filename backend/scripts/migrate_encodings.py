"""
Migration script to load existing face encodings from Supabase into local storage.
Run this once to sync existing users.
"""

import json
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.storage_service import get_supabase_service
from services.face_service import get_face_service

def migrate_encodings():
    """Load all face encodings from Supabase and save to local storage"""
    supabase = get_supabase_service()
    face_service = get_face_service()
    
    print("Starting encoding migration...")
    
    # Get all users with face encodings
    response = supabase.client.table('users').select('id, name, email, face_encoding').not_.is_('face_encoding', 'null').execute()
    
    if not response.data:
        print("No users with face encodings found.")
        return
    
    success_count = 0
    error_count = 0
    
    for user in response.data:
        try:
            # Parse the face encoding JSON
            encoding = json.loads(user['face_encoding'])
            
            # Save to local storage
            face_service.save_encoding(
                user_id=user['id'],
                encoding=encoding,
                user_data={
                    'name': user['name'],
                    'email': user['email']
                }
            )
            
            print(f"✓ Migrated encoding for {user['name']} ({user['email']})")
            success_count += 1
            
        except Exception as e:
            print(f"✗ Failed to migrate {user['name']}: {str(e)}")
            error_count += 1
    
    print(f"\nMigration complete!")
    print(f"Success: {success_count}")
    print(f"Errors: {error_count}")
    print(f"Total encodings in local storage: {face_service.get_encoding_count()}")

if __name__ == "__main__":
    migrate_encodings()
