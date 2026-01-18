from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional, List
import bcrypt
import json
from services.face_service import get_face_service
from services.storage_service import get_supabase_service

router = APIRouter(prefix="/api", tags=["registration"])

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

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
        
        # Collect all face images
        face_images = {}
        if image:
            face_images['front'] = await image.read()
        if image_front:
            face_images['front'] = await image_front.read()
        if image_left:
            face_images['left'] = await image_left.read()
        if image_right:
            face_images['right'] = await image_right.read()
        if image_up:
            face_images['up'] = await image_up.read()
        if image_down:
            face_images['down'] = await image_down.read()
        
        if not face_images:
            raise HTTPException(status_code=400, detail="At least one face image is required")
        
        # Extract face encodings from all images
        encodings = []
        for angle, image_data in face_images.items():
            result = face_service.extract_encoding(image_data)
            if result.success and result.encoding is not None:
                encodings.append(result.encoding)
        
        if not encodings:
            raise HTTPException(status_code=400, detail="No face detected in any of the images")
        
        # Average the encodings for better accuracy
        import numpy as np
        avg_encoding = np.mean(encodings, axis=0)
        face_encoding_json = json.dumps(avg_encoding.tolist())
        
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
                encoding=avg_encoding.tolist(),
                user_data={"name": name, "email": email}
            )
        except Exception as e:
            print(f"Warning: Failed to save encoding to local storage: {str(e)}")
        
        # Upload face images to storage
        for angle, image_data in face_images.items():
            try:
                file_path = f"{user_id}/{angle}.jpg"
                supabase.client.storage.from_('face-images').upload(
                    file_path,
                    image_data,
                    {"content-type": "image/jpeg"}
                )
                
                # Save image record
                supabase.client.table('face_images').insert({
                    "user_id": user_id,
                    "image_url": file_path,
                    "image_type": angle
                }).execute()
            except Exception as e:
                print(f"Warning: Failed to upload {angle} image: {str(e)}")
        
        return {
            "success": True,
            "user_id": user_id,
            "message": "Registration successful"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")
