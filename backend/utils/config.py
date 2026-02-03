"""
Configuration management for Smart Glass AI backend.
Loads and validates environment variables.
"""

import os
from typing import List, Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Application configuration class."""
    
    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")
    
    # Face Recognition Configuration
    FACE_RECOGNITION_TOLERANCE: float = float(os.getenv("FACE_RECOGNITION_TOLERANCE", "0.6"))
    MAX_IMAGE_SIZE_MB: int = int(os.getenv("MAX_IMAGE_SIZE_MB", "5"))
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        origin.strip() for origin in os.getenv(
            "CORS_ORIGINS", 
            "http://localhost:3000,http://localhost:5173"
        ).split(",") if origin.strip()
    ]
    
    # Server Configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")
    
    # Storage Configuration
    LOCAL_ENCODINGS_PATH: str = os.getenv("LOCAL_ENCODINGS_PATH", "data/encodings.json")
    
    # Security Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    @classmethod
    def validate(cls) -> None:
        """
        Validate required configuration values.
        Raises ValueError if required values are missing.
        """
        errors = []
        
        # 1. Check required fields
        required_fields = [
            ("SUPABASE_URL", cls.SUPABASE_URL),
            ("SUPABASE_KEY", cls.SUPABASE_KEY)
        ]
        for name, value in required_fields:
            if not value:
                errors.append(f"{name} is required")
        
        # 2. Validate ranges and constraints
        constraints = [
            (0.0 <= cls.FACE_RECOGNITION_TOLERANCE <= 1.0, "FACE_RECOGNITION_TOLERANCE must be between 0.0 and 1.0"),
            (cls.MAX_IMAGE_SIZE_MB > 0, "MAX_IMAGE_SIZE_MB must be greater than 0"),
            (1 <= cls.PORT <= 65535, "PORT must be between 1 and 65535")
        ]
        
        for is_valid, error_msg in constraints:
            if not is_valid:
                errors.append(error_msg)
        
        if errors:
            raise ValueError(
                "Configuration validation failed:\n" + "\n".join(f"  - {error}" for error in errors)
            )
    
    @classmethod
    def get_max_image_size_bytes(cls) -> int:
        """Get maximum image size in bytes."""
        return cls.MAX_IMAGE_SIZE_MB * 1024 * 1024
    
    @classmethod
    def is_production(cls) -> bool:
        """Check if running in production mode."""
        return not cls.DEBUG
    
    @classmethod
    def display_config(cls) -> str:
        """
        Display current configuration (without sensitive data).
        Useful for debugging and logging.
        """
        return f"""
Smart Glass AI Backend Configuration:
=====================================
Supabase URL: {cls.SUPABASE_URL[:30]}... (hidden)
Face Recognition Tolerance: {cls.FACE_RECOGNITION_TOLERANCE}
Max Image Size: {cls.MAX_IMAGE_SIZE_MB} MB
CORS Origins: {', '.join(cls.CORS_ORIGINS)}
Host: {cls.HOST}
Port: {cls.PORT}
Debug Mode: {cls.DEBUG}
Local Encodings Path: {cls.LOCAL_ENCODINGS_PATH}
=====================================
        """.strip()


# Create a singleton instance
config = Config()


def get_config() -> Config:
    """Get the application configuration instance."""
    return config


def validate_config() -> None:
    """Validate the application configuration."""
    config.validate()


# Validate configuration on import (optional - can be called explicitly in main.py)
if __name__ == "__main__":
    try:
        validate_config()
        print("✓ Configuration is valid")
        print(config.display_config())
    except ValueError as e:
        print(f"✗ Configuration error: {e}")
