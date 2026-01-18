from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from services.storage_service import get_supabase_service
from services.profile_picture_service import get_profile_picture_url, ProfilePictureError
from routers.auth import get_current_user

router = APIRouter(prefix="/api/profile", tags=["profile"])

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
async def get_profile(user_id: str):
    """
    Get complete user profile including medical info, relatives, and profile picture URL
    """
    supabase = get_supabase_service()
    
    try:
        # Get user basic info
        user_response = supabase.client.table('users').select('id, name, email, phone, date_of_birth, gender, nationality, id_number').eq('id', user_id).execute()
        
        if not user_response.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = user_response.data[0]
        
        # Get medical info
        medical_response = supabase.client.table('medical_info').select('*').eq('user_id', user_id).execute()
        medical_info = medical_response.data[0] if medical_response.data else {}
        
        # Get relatives
        relatives_response = supabase.client.table('relatives').select('*').eq('user_id', user_id).execute()
        relatives = relatives_response.data if relatives_response.data else []
        
        # Get profile picture URL
        # If retrieval fails, set to None to maintain backward compatibility
        profile_picture_url = None
        try:
            profile_picture_url = get_profile_picture_url(user_id, supabase.client)
        except ProfilePictureError as e:
            # Log error but don't fail the entire request
            print(f"Warning: Failed to retrieve profile picture for user {user_id}: {str(e)}")
        
        return {
            **user,
            "medical_info": medical_info,
            "relatives": relatives,
            "profile_picture_url": profile_picture_url
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch profile: {str(e)}")

@router.put("/main-info/{user_id}")
async def update_main_info(user_id: str, data: MainInfoUpdate):
    """
    Update user's main information
    """
    supabase = get_supabase_service()
    
    try:
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
async def update_medical_info(user_id: str, data: MedicalInfoUpdate):
    """
    Update user's medical information
    """
    supabase = get_supabase_service()
    
    try:
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
async def update_relatives(user_id: str, data: RelativesUpdate):
    """
    Update user's relatives/connections
    """
    supabase = get_supabase_service()
    
    try:
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
