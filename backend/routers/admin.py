from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import List, Optional
import httpx
from services.storage_service import get_supabase_service
from routers.auth import get_current_user
from utils.config import get_config

router = APIRouter(prefix="/api/users", tags=["admin"])
settings = get_config()

# --- Admin Models ---

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
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: str = Query(None, description="Search by name or email"),
    role: str = Query(None, description="Filter by role"),
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Admin: List all users with pagination and search.
    """
    supabase = get_supabase_service()
    
    try:
        if q:
            # If searching, we'll perform two separate queries and merge them
            # This is more robust than using .or_() which varies by client version
            
            # 1. Search by name
            query_name = supabase.client.table('users').select('*').ilike('name', f'%{q}%')
            if role:
                query_name = query_name.eq('role', role)
            name_results = query_name.execute()
            
            # 2. Search by email
            query_email = supabase.client.table('users').select('*').ilike('email', f'%{q}%')
            if role:
                query_email = query_email.eq('role', role)
            email_results = query_email.execute()
            
            # Merge results (deduplicate by ID)
            all_users_map = {}
            for u in (name_results.data or []):
                all_users_map[u['id']] = u
            for u in (email_results.data or []):
                all_users_map[u['id']] = u
                
            users_data = list(all_users_map.values())
            
            # Manual sorting (created_at desc)
            users_data.sort(key=lambda x: x.get('created_at', ''), reverse=True)
            
            # Manual pagination
            total = len(users_data)
            start_idx = (page - 1) * page_size
            end_idx = start_idx + page_size
            users_data = users_data[start_idx:end_idx]
            
        else:
            # Standard query for no search term
            query = supabase.client.table('users').select('*', count='exact')
            
            if role:
                query = query.eq('role', role)
                
            query = query.order('created_at', desc=True)
            query = query.range((page - 1) * page_size, page * page_size - 1)
            
            result = query.execute()
            users_data = result.data
            total = result.count if result.count is not None else len(users_data)
        
        users = []
        for u in users_data:
            users.append(UserAdminView(
                id=u['id'],
                name=u.get('name', 'Unknown'),
                email=u.get('email', 'Unknown'),
                role=u.get('role', 'user'),
                created_at=u.get('created_at'),
                last_login=u.get('last_sign_in_at')
            ))
            
        return {
            "users": users,
            "total": total,
            "page": page,
            "page_size": page_size
        }
        
    except Exception as e:
        print(f"Admin list users error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
        check = supabase.client.table('users').select('id').eq('id', user_id).execute()
        if not check.data:
            raise HTTPException(status_code=404, detail="User not found")
            
        # full cleanup
        from services.user_service import delete_user_fully
        delete_user_fully(user_id)
        
        return {"message": "User deleted successfully"}
        
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
        result = supabase.client.table('users').update(data_to_update).eq('id', user_id).execute()
        if not result.data:
             raise HTTPException(status_code=404, detail="User not found or update failed")
             
        return {"message": "User updated successfully", "user": result.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")
