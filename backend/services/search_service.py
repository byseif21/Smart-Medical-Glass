from typing import Dict, Any
from services.storage_service import get_supabase_service
from models.user import UserSearchFilters

def get_users_paginated(filters: UserSearchFilters) -> Dict[str, Any]:
    """
    Get paginated users list with optional search and role filter.
    Returns: { "users": [...], "total": int }
    """
    supabase = get_supabase_service()
    
    return supabase.search_users(filters)
