from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
import json
from services.face_service import get_face_service
from services.storage_service import get_supabase_service
from services.contact_service import get_emergency_contacts
from services.profile_picture_service import get_profile_picture_url
from utils.config import get_config
from routers.auth import get_current_user

router = APIRouter(prefix="/api", tags=["recognition"])
settings = get_config()

@router.post("/recognize")
async def recognize_face(image: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """
    Recognize a person from their face image.
    Returns complete profile if match found.
    """
    supabase = get_supabase_service()
    face_service = get_face_service()
    
    try:
        # Read and process image
        image_data = await image.read()
        
        result = face_service.extract_encoding(image_data)
        if not result.success or result.encoding is None:
            error_msg = result.error or "No face detected in the image"
            raise HTTPException(status_code=400, detail=error_msg)
        
        # Manual recognition logic for full control
        stored_encodings = face_service.load_encodings()
        best_match = None
        best_distance = float('inf')
        
        for stored in stored_encodings:
            distance = face_service.compare_faces(result.encoding, stored.encoding)
            if distance < best_distance:
                best_distance = distance
                best_match = stored
        
        # Check if match is good enough
        is_match = best_match is not None and best_distance < settings.FACE_RECOGNITION_TOLERANCE
        
        if is_match and best_match:
            confidence = 1.0 - best_distance
            user_resp = supabase.client.table('users').select('*').eq('id', best_match.user_id).execute()
            if not user_resp.data:
                raise HTTPException(status_code=404, detail="User not found")
            user = user_resp.data[0]
            
            # Fetch profile picture URL
            profile_picture_url = None
            try:
                profile_picture_url = get_profile_picture_url(user['id'], supabase.client)
            except Exception:
                profile_picture_url = None
                
            role = (current_user or {}).get('role') or 'user'
            response_payload = {
                "success": True,
                "match": True,
                "confidence": confidence,
                "user_id": user['id'],
                "name": user['name'],
                "profile_picture_url": profile_picture_url,
                "date_of_birth": user.get('date_of_birth'),
                "gender": user.get('gender'),
                "nationality": user.get('nationality'),
                "id_number": user.get('id_number'),
            }
            if role in ["doctor", "admin"]:
                medical_response = supabase.client.table('medical_info').select('*').eq('user_id', user['id']).execute()
                medical_info = medical_response.data[0] if medical_response.data else {}
                response_payload["medical_info"] = medical_info 
                emergency_contacts = get_emergency_contacts(supabase.client, user['id'])
                response_payload["emergency_contacts"] = emergency_contacts
            return response_payload
        else:
            return {
                "success": True,
                "match": False,
                "message": "Face not recognized",
                "confidence": (1.0 - best_distance) if best_distance != float('inf') else 0.0
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")
