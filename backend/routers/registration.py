from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import json
from services.face_service import get_face_service, FaceRecognitionError, upload_face_images, collect_face_images
from services.storage_service import get_supabase_service
from services.security import hash_password

router = APIRouter(prefix="/api", tags=["registration"])

@router.post("/register")
async def register_user(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    phone: Optional[str] = Form(None),
    date_of_birth: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    nationality: Optional[str] = Form(None),
    id_number: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    # Multi-angle images
    image_front: Optional[UploadFile] = File(None),
    image_left: Optional[UploadFile] = File(None),
    image_right: Optional[UploadFile] = File(None),
    image_up: Optional[UploadFile] = File(None),
    image_down: Optional[UploadFile] = File(None),
):
    """
    Register a new user with face image(s) and personal information.
    Supports both single image and multi-angle face capture.
    """
    supabase = get_supabase_service()
    face_service = get_face_service()
    
    try:
        # Check if user already exists
        existing = supabase.client.table('users').select('id').eq('email', email).execute()
        if existing.data:
            raise HTTPException(status_code=409, detail="User with this email already exists")
        
        # TODO: prevent duplicate face registration by checking for existing face ID
        # Idea: compute avg_encoding first, then use face_service.find_match(avg_encoding.tolist())
        # matched?, return 409: "A user with this face already exists"
        
        # Hash password
        password_hash = hash_password(password)
        
        # Collect face images
        face_images = await collect_face_images(
            image, image_front, image_left, image_right, image_up, image_down
        )
        
        if not face_images:
            raise HTTPException(status_code=400, detail="At least one face image is required")
        
        # Process face images to get average encoding
        try:
            avg_encoding = face_service.process_face_images(face_images)
        except FaceRecognitionError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        face_encoding_json = json.dumps(avg_encoding)
        
        # TODO: after computing avg_encoding, verify it is unique before creating the user record
        # if face_service.find_match indicates a match, abort insert and inform client with a clear message
        
        # Create user in database
        user_data = {
            "name": name,
            "email": email,
            "phone": phone,
            "password_hash": password_hash,
            "date_of_birth": date_of_birth,
            "gender": gender,
            "nationality": nationality,
            "id_number": id_number,
            "face_encoding": face_encoding_json
        }
        
        response = supabase.client.table('users').insert(user_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create user")
        
        user_id = response.data[0]['id']
        
        # Save encoding to local face service storage for fast matching
        try:
            face_service.save_encoding(
                user_id=user_id,
                encoding=avg_encoding,
                user_data={"name": name, "email": email}
            )
        except Exception as e:
            print(f"Warning: Failed to save encoding to local storage: {str(e)}")
        
        # Upload face images to storage
        upload_face_images(supabase, user_id, face_images)
        
        return {
            "success": True,
            "user_id": user_id,
            "message": "Registration successful"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")
