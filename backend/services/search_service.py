from typing import List, Dict, Any, Optional, Tuple
import re
import uuid
from dataclasses import dataclass
from services.storage_service import get_supabase_service

@dataclass
class UserSearchFilters:
    """Filters for user search."""
    query: Optional[str] = None
    role: Optional[str] = None
    exclude_id: Optional[str] = None
    page: int = 1
    page_size: int = 20

def get_users_paginated(filters: UserSearchFilters) -> Dict[str, Any]:
    """
    Get paginated users list with optional search and role filter.
    Returns: { "users": [...], "total": int }
    """
    supabase = get_supabase_service()
    
    # Internal filters dict for helper functions
    internal_filters = {
        "query": filters.query,
        "role": filters.role,
        "exclude_id": filters.exclude_id
    }
    pagination = (filters.page, filters.page_size)
    
    if filters.query:
        return _get_search_results(supabase, internal_filters, pagination)
    else:
        return _get_standard_results(supabase, internal_filters, pagination)

def _get_search_results(supabase, filters: Dict[str, Any], pagination: Tuple[int, int]) -> Dict[str, Any]:
    query_str = filters.get("query", "")
    role_filter = filters.get("role")
    exclude_id = filters.get("exclude_id")
    page, page_size = pagination
    
    # Build query
    query = supabase.client.table('users').select('*', count='exact')
    
    # Check if query is a valid UUID (matches exact ID search)
    is_uuid = False
    try:
        # This handles hex strings with/without dashes
        uuid_obj = uuid.UUID(query_str)
        normalized_uuid = str(uuid_obj)
        is_uuid = True
    except ValueError:
        pass
    
    # Search condition: name OR email matches query (OR id if valid UUID)
    if is_uuid:
        or_condition = f"id.eq.{normalized_uuid},name.ilike.%{query_str}%,email.ilike.%{query_str}%"
    else:
        or_condition = f"name.ilike.%{query_str}%,email.ilike.%{query_str}%"
        
    query = query.or_(or_condition)
    
    if role_filter:
        query = query.eq('role', role_filter)
        
    if exclude_id:
        query = query.neq('id', exclude_id)
        
    # Sort and Paginate
    query = query.order('created_at', desc=True)
    query = query.range((page - 1) * page_size, page * page_size - 1)
    
    result = query.execute()
    return {"users": result.data or [], "total": result.count or 0}

def _get_standard_results(supabase, filters: Dict[str, Any], pagination: Tuple[int, int]) -> Dict[str, Any]:
    role_filter = filters.get("role")
    exclude_id = filters.get("exclude_id")
    page, page_size = pagination
    
    query = supabase.client.table('users').select('*', count='exact')
    
    if role_filter:
        query = query.eq('role', role_filter)
        
    if exclude_id:
        query = query.neq('id', exclude_id)
        
    query = query.order('created_at', desc=True)
    query = query.range((page - 1) * page_size, page * page_size - 1)
    
    result = query.execute()
    return {"users": result.data, "total": result.count}
