from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import bcrypt
import json
from services.storage_service import get_supabase_service
from services.profile_picture_service import get_profile_picture_url, save_profile_picture, ProfilePictureError
from services.contact_service import get_emergency_contacts
from services.face_service import get_face_service, FaceRecognitionError, upload_face_images, collect_face_images
from services.security import verify_password
from routers.auth import get_current_user, verify_user_access

router = APIRouter(prefix="/api/profile", tags=["profile"])

class DeleteAccountRequest(BaseModel):
    password: str

class PrivacySettingsUpdate(BaseModel):
    is_name_public: Optional[bool] = None
    is_id_number_public: Optional[bool] = None
    is_phone_public: Optional[bool] = None
    is_email_public: Optional[bool] = None
    is_dob_public: Optional[bool] = None
    is_gender_public: Optional[bool] = None
    is_nationality_public: Optional[bool] = None

class MainInfoUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    nationality: Optional[str] = None
    gender: Optional[str] = None
    id_number: Optional[str] = None

class MedicalInfoUpdate(BaseModel):
    health_history: Optional[str] = None
    chronic_conditions: Optional[str] = None
    allergies: Optional[str] = None
    current_medications: Optional[str] = None
    previous_surgeries: Optional[str] = None
    emergency_notes: Optional[str] = None

class Relative(BaseModel):
    id: Optional[int] = None
    name: str
    relation: str
    phone: str
    address: Optional[str] = None

class RelativesUpdate(BaseModel):
    relatives: List[Relative]

@router.get("/{user_id}")
async def get_profile(user_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get complete user profile including medical info, relatives, and profile picture URL
    """
    supabase = get_supabase_service()
    
    try:
        current_user_id = (current_user or {}).get("sub")
        role = (current_user or {}).get("role") or "user"

        # Get user basic info
        user_response = supabase.client.table('users').select('id, name, email, phone, date_of_birth, gender, nationality, id_number, face_updated_at, is_name_public, is_id_number_public, is_phone_public, is_email_public, is_dob_public, is_gender_public, is_nationality_public').eq('id', user_id).execute()
        
        if not user_response.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = user_response.data[0]

        # Get profile picture URL
        # If retrieval fails, set to None to maintain backward compatibility
        profile_picture_url = None
        try:
            profile_picture_url = get_profile_picture_url(user_id, supabase.client)
        except ProfilePictureError as e:
            # Log error but don't fail the entire request
            print(f"Warning: Failed to retrieve profile picture for user {user_id}: {str(e)}")
        
        is_self = current_user_id == user_id
        can_view_full = is_self or role in ["doctor", "admin"]

        response_payload = {
            **user,
            "profile_picture_url": profile_picture_url
        }

        if can_view_full:
            medical_response = supabase.client.table('medical_info').select('*').eq('user_id', user_id).execute()
            medical_info = medical_response.data[0] if medical_response.data else {}
            emergency_contacts = get_emergency_contacts(supabase.client, user_id)

            response_payload["medical_info"] = medical_info
            response_payload["emergency_contacts"] = emergency_contacts
        else:
            response_payload.pop("email", None)

        return response_payload
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch profile: {str(e)}")

@router.put("/privacy/{user_id}")
async def update_privacy_settings(user_id: str, data: PrivacySettingsUpdate, current_user: dict = Depends(get_current_user)):
    """
    Update user's privacy settings
    """
    supabase = get_supabase_service()
    
    try:
        verify_user_access(current_user, user_id)

        # Prepare update data (only include non-None values)
        update_data = {k: v for k, v in data.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No data provided for update")
        
        # Update user
        response = supabase.client.table('users').update(update_data).eq('id', user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "message": "Privacy settings updated successfully",
            "data": response.data[0]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update privacy settings: {str(e)}")

@router.put("/main-info/{user_id}")
async def update_main_info(user_id: str, data: MainInfoUpdate, current_user: dict = Depends(get_current_user)):
    """
    Update user's main information
    """
    supabase = get_supabase_service()
    
    try:
        verify_user_access(current_user, user_id)

        # Prepare update data (only include non-None values)
        update_data = {k: v for k, v in data.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No data provided for update")
        
        # Update user
        response = supabase.client.table('users').update(update_data).eq('id', user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "message": "Main info updated successfully",
            "data": response.data[0]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update main info: {str(e)}")

@router.put("/medical-info/{user_id}")
async def update_medical_info(user_id: str, data: MedicalInfoUpdate, current_user: dict = Depends(get_current_user)):
    """
    Update user's medical information
    """
    supabase = get_supabase_service()
    
    try:
        verify_user_access(current_user, user_id)

        # Prepare update data
        update_data = {k: v for k, v in data.dict().items() if v is not None}
        update_data['user_id'] = user_id
        
        if len(update_data) == 1:  # Only user_id
            raise HTTPException(status_code=400, detail="No data provided for update")
        
        # Check if medical info exists
        existing = supabase.client.table('medical_info').select('id').eq('user_id', user_id).execute()
        
        if existing.data:
            # Update existing
            response = supabase.client.table('medical_info').update(update_data).eq('user_id', user_id).execute()
        else:
            # Insert new
            response = supabase.client.table('medical_info').insert(update_data).execute()
        
        return {
            "message": "Medical info updated successfully",
            "data": response.data[0] if response.data else {}
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update medical info: {str(e)}")

@router.put("/relatives/{user_id}")
async def update_relatives(user_id: str, data: RelativesUpdate, current_user: dict = Depends(get_current_user)):
    """
    Update user's relatives/connections
    """
    supabase = get_supabase_service()
    
    try:
        verify_user_access(current_user, user_id)

        # Delete existing relatives
        supabase.client.table('relatives').delete().eq('user_id', user_id).execute()
        
        # Insert new relatives
        if data.relatives:
            relatives_data = [
                {
                    "user_id": user_id,
                    "name": rel.name,
                    "relation": rel.relation,
                    "phone": rel.phone,
                    "address": rel.address
                }
                for rel in data.relatives
            ]
            response = supabase.client.table('relatives').insert(relatives_data).execute()
            
            return {
                "message": "Relatives updated successfully",
                "data": response.data
            }
        
        return {
            "message": "All relatives removed",
            "data": []
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update relatives: {str(e)}")

@router.post("/face/{user_id}")
async def update_face_enrollment(
    user_id: str,
    password: str = Form(...),
    image: Optional[UploadFile] = File(None),
    image_front: Optional[UploadFile] = File(None),
    image_left: Optional[UploadFile] = File(None),
    image_right: Optional[UploadFile] = File(None),
    image_up: Optional[UploadFile] = File(None),
    image_down: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Update user's face enrollment data.
    Requires password verification.
    """
    supabase = get_supabase_service()
    face_service = get_face_service()

    try:
        # Verify access rights
        verify_user_access(current_user, user_id)

        # Get current user data including password hash
        user_response = supabase.client.table('users').select('password_hash, email, name').eq('id', user_id).execute()
        if not user_response.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = user_response.data[0]
        stored_hash = user.get('password_hash')

        # Verify password
        if not stored_hash or not verify_password(password, stored_hash):
             raise HTTPException(status_code=403, detail="Invalid password")

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

        # Update user record
        response = supabase.client.table('users').update({
            "face_encoding": face_encoding_json
        }).eq('id', user_id).execute()

        # Update local face service
        try:
            face_service.save_encoding(
                user_id=user_id,
                encoding=avg_encoding,
                user_data={"name": user['name'], "email": user['email']}
            )
        except Exception as e:
            print(f"Warning: Failed to update local encoding: {str(e)}")

        # Update storage images (overwrite/add new ones)
        upload_face_images(supabase, user_id, face_images)

        return {"message": "Face enrollment updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update face enrollment: {str(e)}")

@router.post("/avatar/{user_id}")
async def update_profile_picture(
    user_id: str,
    image: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Update user's profile picture (avatar).
    Does not require password.
    Does not update biometric face encoding (purely cosmetic).
    """
    supabase = get_supabase_service()

    try:
        # Verify access rights
        verify_user_access(current_user, user_id)

        # Read image
        image_bytes = await image.read()
        
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Empty image file")

        # Save profile picture using dedicated service
        # This handles storage upload and DB record update for 'avatar' type
        # NOTE: get_supabase_service() returns a SupabaseService wrapper object, 
        # but save_profile_picture expects the raw supabase client.
        # We access the raw client via the .client attribute.
        public_url = save_profile_picture(user_id, image_bytes, supabase.client)

        return {
            "message": "Profile picture updated successfully",
            "data": {
                "profile_picture_url": public_url
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update profile picture: {str(e)}")

@router.post("/delete")
async def delete_account(
    payload: DeleteAccountRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Delete user account and all associated data
    """
    supabase = get_supabase_service()
    face_service = get_face_service()
    user_id = current_user.get("sub")
    
    try:
        # Get current user to verify password
        response = supabase.client.table('users').select('password_hash').eq('id', user_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = response.data[0]
        
        # Verify password
        if not verify_password(payload.password, user['password_hash']):
            raise HTTPException(status_code=400, detail="Invalid password")
            
        # 1. Delete face encoding from local file
        face_service.delete_encoding(user_id)
        
        # 2. Delete images from Supabase Storage
        # We try to delete all potential image files
        potential_files = [
            f"{user_id}/avatar.jpg",
            f"{user_id}/front.jpg",
            f"{user_id}/left.jpg",
            f"{user_id}/right.jpg",
            f"{user_id}/up.jpg",
            f"{user_id}/down.jpg"
        ]
        try:
            supabase.client.storage.from_('face-images').remove(potential_files)
        except Exception as e:
            print(f"Warning: Failed to cleanup storage for user {user_id}: {str(e)}")
            # Continue execution, as account deletion is the priority
            
        # 3. Delete user from database
        # This will cascade delete related records (medical_info, relatives, etc.)
        delete_response = supabase.client.table('users').delete().eq('id', user_id).execute()
        
        if not delete_response.data:
            # Note: Supabase delete might return empty data if successful but we can check if error occurred
            # But usually it returns the deleted record
            pass
            
        return {"message": "Account deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Account deletion failed: {str(e)}")
