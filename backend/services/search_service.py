from typing import List, Dict, Any, Optional
import re
from services.storage_service import get_supabase_service

def search_users_db(query: str, current_user_id: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
    """
    Search for users by name, email, or ID (exact/prefix).
    Returns a list of user dictionaries.
    """
    supabase = get_supabase_service()
    clean_query = query.strip().lower()
    
    if len(clean_query) < 2:
        return []

    all_users = {}

    # Execute search strategies
    for user in _search_by_name(supabase, clean_query):
        all_users[user['id']] = user
        
    for user in _search_by_email(supabase, clean_query):
        all_users[user['id']] = user
        
    for user in _search_by_id(supabase, clean_query):
        all_users[user['id']] = user
    
    # Filter out current user and limit results
    users_list = [
        user for user in all_users.values() 
        if not current_user_id or user['id'] != current_user_id
    ]
    
    return users_list[:limit]

def _search_by_name(supabase, query: str) -> List[Dict[str, Any]]:
    try:
        res = supabase.client.table('users').select('id, name, email').ilike('name', f'%{query}%').limit(50).execute()
        return res.data or []
    except Exception as e:
        print(f"Name search error: {e}")
        return []

def _search_by_email(supabase, query: str) -> List[Dict[str, Any]]:
    try:
        res = supabase.client.table('users').select('id, name, email').ilike('email', f'%{query}%').limit(50).execute()
        return res.data or []
    except Exception as e:
        print(f"Email search error: {e}")
        return []

def _search_by_id(supabase, query: str) -> List[Dict[str, Any]]:
    clean_hex = query.replace('-', '')
    if not (re.match(r'^[0-9a-f]+$', clean_hex) and len(clean_hex) <= 32):
        return []
        
    def to_uuid(hex_s):
        return f"{hex_s[:8]}-{hex_s[8:12]}-{hex_s[12:16]}-{hex_s[16:20]}-{hex_s[20:]}"

    try:
        # Exact Match
        if len(clean_hex) == 32:
            target_id = to_uuid(clean_hex)
            res = supabase.client.table('users').select('id, name, email').eq('id', target_id).execute()
            return res.data or []
        
        # Prefix Search
        else:
            start_uuid = to_uuid(clean_hex.ljust(32, '0'))
            end_uuid = to_uuid(clean_hex.ljust(32, 'f'))
            
            res = supabase.client.table('users').select('id, name, email')\
                .gte('id', start_uuid)\
                .lte('id', end_uuid)\
                .limit(50).execute()
            return res.data or []
            
    except Exception as e:
        print(f"ID search error: {e}")
        return []

def get_users_paginated(
    page: int = 1,
    page_size: int = 20,
    query_str: Optional[str] = None,
    role_filter: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get paginated users list with optional search and role filter.
    Returns: { "users": [...], "total": int }
    """
    supabase = get_supabase_service()
    
    if query_str:
        return _get_search_results(supabase, query_str, role_filter, page, page_size)
    else:
        return _get_standard_results(supabase, role_filter, page, page_size)

def _get_search_results(supabase, query_str: str, role_filter: Optional[str], page: int, page_size: int) -> Dict[str, Any]:
    # Search by name
    query_name = supabase.client.table('users').select('*').ilike('name', f'%{query_str}%')
    if role_filter:
        query_name = query_name.eq('role', role_filter)
    name_results = query_name.execute()
    
    # Search by email
    query_email = supabase.client.table('users').select('*').ilike('email', f'%{query_str}%')
    if role_filter:
        query_email = query_email.eq('role', role_filter)
    email_results = query_email.execute()
    
    # Merge results
    all_users_map = {}
    for u in (name_results.data or []):
        all_users_map[u['id']] = u
    for u in (email_results.data or []):
        all_users_map[u['id']] = u
        
    users_data = list(all_users_map.values())
    
    # Sort
    users_data.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    # Pagination
    total = len(users_data)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_users = users_data[start_idx:end_idx]
    
    return {"users": paginated_users, "total": total}

def _get_standard_results(supabase, role_filter: Optional[str], page: int, page_size: int) -> Dict[str, Any]:
    query = supabase.client.table('users').select('*', count='exact')
    
    if role_filter:
        query = query.eq('role', role_filter)
        
    query = query.order('created_at', desc=True)
    query = query.range((page - 1) * page_size, page * page_size - 1)
    
    result = query.execute()
    return {"users": result.data, "total": result.count}
