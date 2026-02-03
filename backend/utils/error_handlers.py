from fastapi import HTTPException
from functools import wraps
from typing import Optional, Callable, Any

class service_guard:
    """
    Unified error handler for service operations.
    Can be used as both a decorator and a context manager.
    
    Usage as decorator:
        @service_guard("Custom error message")
        async def my_method(): ...
        
    Usage as context manager:
        async with service_guard("Custom error message"):
            await service.method()
    """
    def __init__(self, error_message: str = "Operation failed"):
        self.error_message = error_message
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_val:
            _handle_exception(exc_val, self.error_message)
            return False # Should not be reached as _handle_exception raises
        return False

    def __call__(self, func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                _handle_exception(e, self.error_message)
        return wrapper

def _handle_exception(e: Exception, error_message: str):
    """Shared exception handling logic"""
    if isinstance(e, HTTPException):
        raise e
    
    # Keep original error message if it's already descriptive enough, otherwise prepend context
    detail = str(e)
    if error_message and error_message not in detail:
        detail = f"{error_message}: {detail}"
    raise HTTPException(status_code=500, detail=detail)
