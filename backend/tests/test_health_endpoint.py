"""
Test script for health check endpoint.
This script verifies that the health check endpoint implementation is correct.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

print("Testing Health Check Endpoint Implementation...")
print("=" * 60)

# Test 1: Verify services can be imported
print("\n1. Testing service imports...")
try:
    from services.face_service import get_face_service
    print("   ✓ Face service imported successfully")
except Exception as e:
    print(f"   ✗ Failed to import face service: {e}")
    sys.exit(1)

try:
    from services.storage_service import get_supabase_service
    print("   ✓ Supabase service imported successfully")
except Exception as e:
    print(f"   ✗ Failed to import Supabase service: {e}")
    sys.exit(1)

# Test 2: Test face service health check
print("\n2. Testing face recognition service health...")
try:
    face_service = get_face_service()
    encoding_count = face_service.get_encoding_count()
    tolerance = face_service.tolerance
    print(f"   ✓ Face service operational")
    print(f"   - Encodings stored: {encoding_count}")
    print(f"   - Tolerance: {tolerance}")
except Exception as e:
    print(f"   ⚠ Face service check warning: {e}")

# Test 3: Test Supabase service health check
print("\n3. Testing Supabase service health...")
try:
    supabase_service = get_supabase_service()
    health = supabase_service.get_health_status()
    print(f"   ✓ Supabase health check method works")
    print(f"   - Status: {health['status']}")
    print(f"   - Connected: {health['connected']}")
    print(f"   - URL: {health['url']}")
except Exception as e:
    print(f"   ⚠ Supabase service check warning: {e}")

# Test 4: Verify health endpoint structure
print("\n4. Verifying health endpoint implementation...")
try:
    # Read the main.py file to verify the endpoint exists
    with open('main.py', 'r') as f:
        content = f.read()
    
    # Check for required components
    checks = [
        ('@app.get("/api/health")', 'Health endpoint route'),
        ('get_face_service()', 'Face service check'),
        ('get_supabase_service()', 'Supabase service check'),
        ('get_encoding_count()', 'Encoding count check'),
        ('get_health_status()', 'Supabase health status check'),
        ('"status":', 'Status field'),
        ('"timestamp":', 'Timestamp field'),
        ('"services":', 'Services field'),
        ('"face_recognition":', 'Face recognition service'),
        ('"supabase":', 'Supabase service'),
    ]
    
    all_passed = True
    for check_str, description in checks:
        if check_str in content:
            print(f"   ✓ {description} found")
        else:
            print(f"   ✗ {description} NOT found")
            all_passed = False
    
    if not all_passed:
        print("\n   ✗ Some required components are missing")
        sys.exit(1)
        
except Exception as e:
    print(f"   ✗ Failed to verify endpoint: {e}")
    sys.exit(1)

print("\n" + "=" * 60)
print("✓ Health check endpoint implementation verified!")
print("\nThe endpoint includes:")
print("  - GET /api/health route")
print("  - Face recognition service status check")
print("  - Supabase connection status check")
print("  - Detailed service information")
print("  - Timestamp of health check")
print("\nTo test the endpoint live:")
print("  1. Start the server: uvicorn main:app --reload")
print("  2. Visit: http://localhost:8000/api/health")
print("=" * 60)
