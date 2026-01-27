from typing import Dict, Any, Optional

def apply_privacy_settings(user: Dict[str, Any], current_user_role: str = "user") -> Dict[str, Any]:
    """
    Apply privacy settings to user data based on the viewer's role.
    
    Args:
        user: The user dictionary containing profile data and privacy settings.
        current_user_role: The role of the current viewer (e.g., 'user', 'doctor', 'admin').
        
    Returns:
        A dictionary with sensitive fields hidden/shown based on privacy settings.
    """
    is_privileged = current_user_role in ["doctor", "admin"]
    
    # Default to True for name/gender if not set (legacy users), False for ID/Phone/DOB/Nationality
    show_name = is_privileged or user.get('is_name_public', True)
    
    # If name is hidden and user is not privileged, hide everything else (Master Privacy Switch)
    is_account_private = not show_name
    
    show_id = is_privileged or (user.get('is_id_number_public', False) and not is_account_private)
    show_dob = is_privileged or (user.get('is_dob_public', False) and not is_account_private)
    show_gender = is_privileged or (user.get('is_gender_public', True) and not is_account_private)
    show_nationality = is_privileged or (user.get('is_nationality_public', False) and not is_account_private)
    show_phone = is_privileged or (user.get('is_phone_public', False) and not is_account_private)
    show_email = is_privileged or (user.get('is_email_public', False) and not is_account_private)

    return {
        "user_id": user.get('id'),
        "name": user.get('name') if show_name else "Private Account",
        # profile_picture_url is often passed separately or computed, but if present:
        "profile_picture_url": user.get('profile_picture_url') if show_name else None,
        "date_of_birth": user.get('date_of_birth') if show_dob else None,
        "gender": user.get('gender') if show_gender else None,
        "nationality": user.get('nationality') if show_nationality else None,
        "id_number": user.get('id_number') if show_id else None,
        "phone": user.get('phone') if show_phone else None,
        "email": user.get('email') if show_email else None,
    }
