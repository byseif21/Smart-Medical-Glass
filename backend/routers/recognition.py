from fastapi import APIRouter, UploadFile, File, HTTPException
import json
from services.face_service import get_face_service
from services.storage_service import get_supabase_service
from utils.config import get_config

router = APIRouter(prefix="/api", tags=["recognition"])
settings = get_config()

@router.post("/recognize")
async def recognize_face(image: UploadFile = File(...)):
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
        
        # Get all users with face encodings
        response = supabase.client.table('users').select('*').not_.is_('face_encoding', 'null').execute()
        
        if not response.data:
            return {
                "success": False,
                "match": False,
                "message": "No registered users found"
            }
        
        match_result = face_service.find_match(result.encoding)
        
        # Check if match is good enough
        if match_result.matched and match_result.user_id is not None:
            user_resp = supabase.client.table('users').select('*').eq('id', match_result.user_id).execute()
            if not user_resp.data:
                raise HTTPException(status_code=404, detail="User not found")
            user = user_resp.data[0]
            medical_response = supabase.client.table('medical_info').select('*').eq('user_id', user['id']).execute()
            medical_info = medical_response.data[0] if medical_response.data else {}
            relatives_response = supabase.client.table('relatives').select('*').eq('user_id', user['id']).execute()
            relatives = relatives_response.data if relatives_response.data else []
            return {
                "success": True,
                "match": True,
                "confidence": match_result.confidence,
                "name": user['name'],
                "age": user.get('age'),
                "gender": user.get('gender'),
                "nationality": user.get('nationality'),
                "id_number": user.get('id_number'),
                "medical_info": medical_info,
                "relatives": relatives
            }
        else:
            return {
                "success": True,
                "match": False,
                "message": "Face not recognized",
                "confidence": match_result.confidence or 0
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")
