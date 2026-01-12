from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List
from services.storage_service import get_supabase_service

router = APIRouter(prefix="/api/users", tags=["users"])

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
    supabase = get_supabase_service()
    
    # Validate query length
    if len(q.strip()) < 2:
        raise HTTPException(
            status_code=400, 
            detail="Search query must be at least 2 characters long"
        )
    
    query = q.strip().lower()
    
    all_users = {}
    
    # Search by name (case-insensitive)
    try:
        name_results = supabase.client.table('users').select('id, name, email').ilike('name', f'%{query}%').limit(50).execute()
        if name_results.data:
            for user in name_results.data:
                all_users[user['id']] = user
    except Exception as e:
        print(f"Name search error: {e}")
    
    # Search by email (case-insensitive)
    try:
        email_results = supabase.client.table('users').select('id, name, email').ilike('email', f'%{query}%').limit(50).execute()
        if email_results.data:
            for user in email_results.data:
                all_users[user['id']] = user
    except Exception as e:
        print(f"Email search error: {e}")
    
    # Convert to list and exclude current user
    users_list = [user for user in all_users.values() if not current_user_id or user['id'] != current_user_id]
    
    # Limit to 20 results
    users_list = users_list[:20]
    
    user_statuses = {}
    if current_user_id and users_list:
        try:
            target_ids = [u['id'] for u in users_list]
            connections = (
                supabase.client.table('user_connections')
                .select('connected_user_id')
                .eq('user_id', current_user_id)
                .in_('connected_user_id', target_ids)
                .execute()
            )
            for conn in connections.data or []:
                user_statuses[conn['connected_user_id']] = "connected"

            sent_requests = (
                supabase.client.table('connection_requests')
                .select('receiver_id')
                .eq('sender_id', current_user_id)
                .in_('receiver_id', target_ids)
                .eq('status', 'pending')
                .execute()
            )
            for req in sent_requests.data or []:
                user_statuses[req['receiver_id']] = "pending_sent"

            received_requests = (
                supabase.client.table('connection_requests')
                .select('sender_id')
                .eq('receiver_id', current_user_id)
                .in_('sender_id', target_ids)
                .eq('status', 'pending')
                .execute()
            )
            for req in received_requests.data or []:
                user_statuses.setdefault(req['sender_id'], "pending_received")
        except Exception as e:
            print(f"Error checking connection statuses: {e}")
    
    # Convert to response model
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
