import re
from typing import Optional
from email_validator import validate_email, EmailNotValidError

class ValidationError(ValueError):
    """Custom exception for validation errors."""
    pass

def sanitize_text(text: Optional[str]) -> Optional[str]:
    """
    Sanitizes text input by stripping leading/trailing whitespace
    and replacing multiple internal spaces with a single space.
    Returns None if the result is empty or None.
    """
    if text is None:
        return None
    
    # Strip whitespace
    text = text.strip()
    
    # Replace multiple spaces with single space
    text = re.sub(r'\s+', ' ', text)
    
    return text if text else None

def normalize_email(email: str) -> str:
    """
    Validates and normalizes an email address.
    - Lowercases the email
    - Validates format using email-validator
    """
    if not email:
        raise ValidationError("Email is required")
    
    email = email.strip().lower()
    
    try:
        # validate_email returns an object with a normalized email
        valid = validate_email(email, check_deliverability=False)
        return valid.email
    except EmailNotValidError as e:
        raise ValidationError(f"Invalid email format: {str(e)}")

def validate_password(password: str, min_length: int = 8) -> str:
    """
    Validates a password.
    - Checks minimum length
    - Checks for at least one number and one letter (optional but good practice)
    """
    if not password:
        raise ValidationError("Password is required")
        
    if len(password) < min_length:
        raise ValidationError(f"Password must be at least {min_length} characters long")
    
    _check_password_complexity(password)
        
    return password

def _check_password_complexity(password: str) -> None:
    """
    Check if password meets complexity requirements.
    Raises ValidationError if requirements are not met.
    """
    if not any(char.isdigit() for char in password):
        raise ValidationError("Password must contain at least one number")
        
    if not any(char.isalpha() for char in password):
        raise ValidationError("Password must contain at least one letter")

def validate_phone(phone: Optional[str]) -> Optional[str]:
    """
    Validates and basic formatting for phone numbers.
    Removes spaces, dashes, parentheses.
    Checks if it contains valid characters.
    """
    if not phone:
        return None
        
    # Remove common separators
    cleaned = re.sub(r'[\s\-\(\)\.]', '', phone)
    
    if not cleaned:
        return None
        
    # Check if it contains mostly digits (allow leading +)
    if not re.match(r'^\+?[\d]+$', cleaned):
        raise ValidationError("Phone number must contain only digits and optional leading +")
        
    if len(cleaned) < 8 or len(cleaned) > 15:
        # Basic length check (international numbers vary, but usually within this range)
        raise ValidationError("Phone number length must be between 8 and 15 digits")
        
    return cleaned
