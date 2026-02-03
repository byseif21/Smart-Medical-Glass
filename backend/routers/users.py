from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from services.search_service import get_users_paginated
from models.user import UserSearchFilters
from services.connection_service import ConnectionService
from utils.config import get_config

router = APIRouter(prefix="/api/users", tags=["users"])
settings = get_config()

class UserSearchResult(BaseModel):
    id: str
    name: str
    email: str
    connection_status: str = "none" # "none", "connected", "pending_sent", "pending_received"

class UserSearchResponse(BaseModel):
    users: List[UserSearchResult]

@router.get("/search", response_model=UserSearchResponse)
async def search_users(
    q: str = Query(..., min_length=2, description="Search query (name or ID)"),
    current_user_id: str = Query(None, description="Current user ID to exclude from results and check status")
):
    """
    Search for users by name or ID.
    
    - **q**: Search query (minimum 2 characters)
    - **current_user_id**: Optional - ID of current user to exclude from results and check connection status
    
    Returns up to 20 matching users with id, name, email, and connection_status.
    """
    # Validate query length
    if len(q.strip()) < 2:
        raise HTTPException(
            status_code=400, 
            detail="Search query must be at least 2 characters long"
        )
    
    # 1. Search users
    search_filters = UserSearchFilters(
        page=1,
        page_size=20,
        query=q,
        exclude_id=current_user_id
    )
    result = get_users_paginated(search_filters)
    users_list = result['users']
    
    # 2. Enrich with connection status if current_user_id is provided
    user_statuses = {}
    if current_user_id and users_list:
        connection_service = ConnectionService()
        target_ids = [u['id'] for u in users_list]
        user_statuses = connection_service.get_connection_statuses(current_user_id, target_ids)
    
    # 3. Convert to response model
    search_results = [
        UserSearchResult(
            id=user['id'],
            name=user['name'],
            email=user['email'],
            connection_status=user_statuses.get(user['id'], "none")
        )
        for user in users_list
    ]
    
    return UserSearchResponse(users=search_results)
