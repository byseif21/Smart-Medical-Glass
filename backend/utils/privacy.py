from typing import Dict, Any

def apply_privacy_settings(user: Dict[str, Any], current_user_role: str = "user") -> Dict[str, Any]:
    """
    Apply privacy settings to user data based on the viewer's role.
    """
    is_privileged = current_user_role in ["doctor", "admin"]
    
    # Check if account is public (name visibility controls profile visibility)
    # Default to True for legacy users
    is_name_public = user.get('is_name_public', True)
    can_view_basic = is_privileged or is_name_public

    if not can_view_basic:
        return {
            "user_id": user.get('id'),
            "name": "Private Account",
            "profile_picture_url": None,
            "date_of_birth": None,
            "gender": None,
            "nationality": None,
            "id_number": None,
            "phone": None,
            "email": None,
        }

    # Helper to check individual field visibility
    def can_view(field_key: str, default_public: bool = False) -> bool:
        if is_privileged:
            return True
        return user.get(field_key, default_public)

    return {
        "user_id": user.get('id'),
        "name": user.get('name'),
        "profile_picture_url": user.get('profile_picture_url'),
        
        "date_of_birth": user.get('date_of_birth') if can_view('is_dob_public') else None,
        "gender": user.get('gender') if can_view('is_gender_public', True) else None,
        "nationality": user.get('nationality') if can_view('is_nationality_public') else None,
        "id_number": user.get('id_number') if can_view('is_id_number_public') else None,
        "phone": user.get('phone') if can_view('is_phone_public') else None,
        "email": user.get('email') if can_view('is_email_public') else None,
    }
