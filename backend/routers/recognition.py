from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from services.face_service import get_face_service
from services.storage_service import get_supabase_service
from services.contact_service import get_emergency_contacts
from services.profile_picture_service import get_profile_picture_url
from utils.config import get_config
from dependencies import get_current_user

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
        
        # Use service for matching
        match_result = face_service.find_match(result.encoding)
        
        if match_result.matched and match_result.user_id:
            return _handle_successful_match(match_result, current_user, supabase)
        else:
            return _handle_no_match(match_result)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")

def _handle_successful_match(match_result, current_user, supabase):
    user_resp = supabase.client.table('users').select('*').eq('id', match_result.user_id).execute()
    if not user_resp.data:
        raise HTTPException(status_code=404, detail="User not found")
    user = user_resp.data[0]
    
    role = (current_user or {}).get('role') or 'user'
    
    return construct_match_response(user, match_result.confidence, role, supabase)

def _handle_no_match(match_result):
    return {
        "success": True,
        "match": False,
        "message": "Face not recognized",
        "confidence": match_result.confidence or 0.0
    }

def construct_match_response(user, confidence, current_user_role, supabase):
    # Fetch profile picture URL
    profile_picture_url = None
    try:
        profile_picture_url = get_profile_picture_url(user['id'], supabase)
    except Exception:
        profile_picture_url = None
        
    is_privileged = current_user_role in ["doctor", "admin"]

    # Privacy checks
    from utils.privacy import apply_privacy_settings
    
    # Apply privacy settings
    privacy_data = apply_privacy_settings(user, current_user_role)
    
    response_payload = {
        "success": True,
        "match": True,
        "confidence": confidence,
        "user_id": user['id'],
        "name": privacy_data['name'],
        "profile_picture_url": profile_picture_url if privacy_data['name'] != "Private Account" else None,
        "date_of_birth": privacy_data['date_of_birth'],
        "gender": privacy_data['gender'],
        "nationality": privacy_data['nationality'],
        "id_number": privacy_data['id_number'],
    }
    if is_privileged:
        medical_response = supabase.client.table('medical_info').select('*').eq('user_id', user['id']).execute()
        medical_info = medical_response.data[0] if medical_response.data else {}
        response_payload["medical_info"] = medical_info 
        emergency_contacts = get_emergency_contacts(supabase.client, user['id'])
        response_payload["emergency_contacts"] = emergency_contacts
    
    return response_payload
