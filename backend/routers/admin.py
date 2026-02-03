from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import List, Optional
from dataclasses import dataclass
from services.search_service import get_users_paginated
from models.user import UserSearchFilters
from dependencies import get_current_user
from utils.config import get_config

router = APIRouter(prefix="/api/users", tags=["admin"])
settings = get_config()

# --- Admin Models ---

@dataclass
class UserListParams:
    page: int = Query(1, ge=1)
    page_size: int = Query(20, ge=1, le=100)
    q: Optional[str] = Query(None, description="Search by name or email")
    role: Optional[str] = Query(None, description="Filter by role")

class UserAdminView(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: Optional[str] = None
    last_login: Optional[str] = None

class AdminUserListResponse(BaseModel):
    users: List[UserAdminView]
    total: int
    page: int
    page_size: int

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None

# --- Admin Dependencies ---

def get_current_admin_user(current_user: dict = Depends(get_current_user)):
    role = current_user.get("role")
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user

# --- Admin Endpoints ---

@router.get("/", response_model=AdminUserListResponse)
async def list_users_admin(
    params: UserListParams = Depends(),
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Admin: List all users with pagination and search.
    """
    # Delegate to service
    search_filters = UserSearchFilters(
        page=params.page,
        page_size=params.page_size,
        query=params.q,
        role=params.role
    )
    result = get_users_paginated(search_filters)
    
    # Map to response model
    users = [
        UserAdminView(
            id=u['id'],
            name=u['name'],
            email=u['email'],
            role=u.get('role', 'user'),
            created_at=u.get('created_at'),
            last_login=u.get('last_login')
        ) for u in result['users']
    ]
    
    return AdminUserListResponse(
        users=users,
        total=result['total'],
        page=params.page,
        page_size=params.page_size
    )

@router.delete("/{user_id}")
async def delete_user_admin(
    user_id: str,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Admin: Delete a user.
    """
    supabase = get_supabase_service()
    
    # Prevent deleting self
    if user_id == current_user['sub']:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
    
    try:
        # Check if user exists
        if not supabase.get_user(user_id):
            raise HTTPException(status_code=404, detail="User not found")
            
        # full cleanup
        from services.user_service import delete_user_fully
        delete_user_fully(user_id)
        
        return {"message": "User deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")

@router.put("/{user_id}")
async def update_user_admin(
    user_id: str,
    update_data: UserUpdateRequest,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Admin: Update user details (e.g. role).
    """
    supabase = get_supabase_service()
    
    data_to_update = {k: v for k, v in update_data.dict().items() if v is not None}
    
    if not data_to_update:
        raise HTTPException(status_code=400, detail="No data provided for update")
        
    try:
        updated_user = supabase.update_user(user_id, data_to_update)
        if not updated_user:
             raise HTTPException(status_code=404, detail="User not found or update failed")
             
        return {"message": "User updated successfully", "user": updated_user}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")
