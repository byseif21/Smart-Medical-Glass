from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List
from services.storage_service import get_supabase_service

router = APIRouter(prefix="/api/users", tags=["users"])

class UserSearchResult(BaseModel):
    id: str
    name: str
    email: str

class UserSearchResponse(BaseModel):
    users: List[UserSearchResult]

@router.get("/search", response_model=UserSearchResponse)
async def search_users(
    q: str = Query(..., min_length=2, description="Search query (name or ID)"),
    current_user_id: str = Query(None, description="Current user ID to exclude from results")
):
    """
    Search for users by name or ID.
    
    - **q**: Search query (minimum 2 characters)
    - **current_user_id**: Optional - ID of current user to exclude from results
    
    Returns up to 20 matching users with id, name, and email only.
    """
    supabase = get_supabase_service()
    
    try:
        # Validate query length
        if len(q.strip()) < 2:
            raise HTTPException(
                status_code=400, 
                detail="Search query must be at least 2 characters long"
            )
        
        query = q.strip()
        
        # Build the query - search by name (case-insensitive) or ID
        # Using ilike for case-insensitive search on name
        # We'll do two separate queries and merge results to handle OR logic
        
        # Search by name (case-insensitive)
        name_results = supabase.client.table('users').select('id, name, email').ilike('name', f'%{query}%').limit(20).execute()
        
        # Search by ID (partial match)
        id_results = supabase.client.table('users').select('id, name, email').ilike('id', f'%{query}%').limit(20).execute()
        
        # Merge results and remove duplicates using a dictionary
        all_users = {}
        
        if name_results.data:
            for user in name_results.data:
                all_users[user['id']] = user
        
        if id_results.data:
            for user in id_results.data:
                all_users[user['id']] = user
        
        # Convert to list
        users_list = list(all_users.values())
        
        # Exclude current user if provided
        if current_user_id:
            users_list = [user for user in users_list if user['id'] != current_user_id]
        
        # Limit to 20 results
        users_list = users_list[:20]
        
        # Convert to response model
        search_results = [
            UserSearchResult(
                id=user['id'],
                name=user['name'],
                email=user['email']
            )
            for user in users_list
        ]
        
        return UserSearchResponse(users=search_results)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"User search failed: {str(e)}"
        )
