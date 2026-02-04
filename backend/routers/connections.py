from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Annotated
from services.connection_service import ConnectionService
from dependencies import get_current_user, verify_user_access
from models.connections import (
    CreateLinkedConnectionRequest,
    CreateExternalContactRequest,
    CreateExternalContactResponse,
    CreateLinkedConnectionResponse,
    ConnectionRequestResponse,
    GetConnectionsResponse,
    UpdateLinkedConnectionRequest,
    UpdateExternalContactRequest,
    UpdateConnectionResponse,
    DeleteConnectionResponse
)

router = APIRouter(prefix="/api/connections", tags=["connections"])

def get_current_user_id(current_user: dict = Depends(get_current_user)) -> str:
    """
    Extract user ID from validated JWT token.
    Replaces insecure header-based extraction.
    """
    return current_user["sub"]

def get_connection_service() -> ConnectionService:
    return ConnectionService()

# Type Aliases for Dependencies to reduce signature duplication
UserDep = Annotated[str, Depends(get_current_user_id)]
ServiceDep = Annotated[ConnectionService, Depends(get_connection_service)]

@router.post("/linked/request", response_model=CreateLinkedConnectionResponse)
async def create_connection_request(
    request: CreateLinkedConnectionRequest,
    current_user_id: UserDep,
    service: ServiceDep
):
    """
    Send a connection request to another user.
    """
    return await service.create_connection_request(current_user_id, request)

@router.get("/requests/pending", response_model=List[ConnectionRequestResponse])
async def get_pending_requests(
    current_user_id: UserDep,
    service: ServiceDep
):
    """
    Get all pending connection requests.
    """
    requests = await service.get_pending_requests(current_user_id)
    return [
        ConnectionRequestResponse(
            id=req['id'],
            sender_id=req['sender_id'],
            sender_name=req['users']['name'],
            sender_email=req['users']['email'],
            relationship=req['relationship'],
            status=req['status'],
            created_at=req['created_at']
        ) for req in requests
    ]

@router.post("/requests/{request_id}/accept", response_model=CreateLinkedConnectionResponse)
async def accept_request(
    request_id: str,
    current_user_id: UserDep,
    service: ServiceDep
):
    """
    Accept a connection request.
    """
    return await service.accept_request(request_id, current_user_id)

@router.post("/requests/{request_id}/reject", response_model=CreateLinkedConnectionResponse)
async def reject_request(
    request_id: str,
    current_user_id: UserDep,
    service: ServiceDep
):
    """
    Reject a connection request.
    """
    return await service.reject_request(request_id, current_user_id)

@router.post("/linked", response_model=CreateLinkedConnectionResponse)
async def create_linked_connection(
    request: CreateLinkedConnectionRequest,
    current_user_id: UserDep,
    service: ServiceDep
):
    """
    Create a direct linked connection.
    """
    return await service.create_linked_connection(current_user_id, request)

@router.post("/external", response_model=CreateExternalContactResponse)
async def create_external_contact(
    request: CreateExternalContactRequest,
    current_user_id: UserDep,
    service: ServiceDep
):
    """
    Create an external contact.
    """
    return await service.create_external_contact(current_user_id, request)

@router.get("/", response_model=GetConnectionsResponse)
async def get_all_connections(
    current_user: dict = Depends(get_current_user),
    service: ServiceDep = None, # ServiceDep default to handle non-default arg following default arg
    user_id: Optional[str] = None
):
    """
    Get all connections (linked and external).
    
    - **user_id**: Optional ID to fetch connections for a specific user (admin/viewing mode).
                   If not provided, fetches connections for the current authenticated user.
    """
    if service is None:
        service = ConnectionService()

    current_user_id = current_user["sub"]
    target_id = user_id if user_id else current_user_id
    
    # Permission check: Allow if self or admin
    verify_user_access(current_user, target_id)
        
    return await service.get_all_connections(target_id)

@router.put("/linked/{connection_id}", response_model=UpdateConnectionResponse)
async def update_linked_connection(
    connection_id: str,
    request: UpdateLinkedConnectionRequest,
    current_user_id: UserDep,
    service: ServiceDep
):
    """
    Update a linked connection (relationship only).
    """
    return await service.update_linked_connection(connection_id, current_user_id, request)

@router.put("/external/{contact_id}", response_model=UpdateConnectionResponse)
async def update_external_contact(
    contact_id: str,
    request: UpdateExternalContactRequest,
    current_user_id: UserDep,
    service: ServiceDep
):
    """
    Update an external contact.
    """
    return await service.update_external_contact(contact_id, current_user_id, request)

@router.delete("/{connection_id}", response_model=DeleteConnectionResponse)
async def delete_connection(
    connection_id: str,
    current_user_id: UserDep,
    service: ServiceDep
):
    """
    Delete a connection (linked or external).
    """
    return await service.delete_connection(connection_id, current_user_id)
