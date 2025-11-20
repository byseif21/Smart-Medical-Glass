from fastapi import APIRouter, UploadFile, File, HTTPException
import json
import numpy as np
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
        
        # Extract face encoding
        encoding = face_service.extract_face_encoding(image_data)
        
        if encoding is None:
            raise HTTPException(status_code=400, detail="No face detected in the image")
        
        # Get all users with face encodings
        response = supabase.client.table('users').select('*').not_.is_('face_encoding', 'null').execute()
        
        if not response.data:
            return {
                "success": False,
                "match": False,
                "message": "No registered users found"
            }
        
        # Find best match
        best_match = None
        best_distance = float('inf')
        
        for user in response.data:
            if user['face_encoding']:
                stored_encoding = np.array(json.loads(user['face_encoding']))
                distance = face_service.compare_faces(encoding, stored_encoding)
                
                if distance < best_distance:
                    best_distance = distance
                    best_match = user
        
        # Check if match is good enough
        if best_match and best_distance < settings.FACE_RECOGNITION_TOLERANCE:
            # Get medical info
            medical_response = supabase.client.table('medical_info').select('*').eq('user_id', best_match['id']).execute()
            medical_info = medical_response.data[0] if medical_response.data else {}
            
            # Get relatives
            relatives_response = supabase.client.table('relatives').select('*').eq('user_id', best_match['id']).execute()
            relatives = relatives_response.data if relatives_response.data else []
            
            return {
                "success": True,
                "match": True,
                "confidence": 1 - best_distance,
                "name": best_match['name'],
                "age": best_match.get('age'),
                "gender": best_match.get('gender'),
                "nationality": best_match.get('nationality'),
                "id_number": best_match.get('id_number'),
                "medical_info": medical_info,
                "relatives": relatives
            }
        else:
            return {
                "success": True,
                "match": False,
                "message": "Face not recognized",
                "confidence": 1 - best_distance if best_match else 0
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")
