from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import re
from services.storage_service import get_supabase_service
from routers.auth import get_current_user

router = APIRouter(prefix="/api/connections", tags=["connections"])

# Predefined relationship types
RELATIONSHIP_TYPES = [
    "Father",
    "Mother",
    "Brother",
    "Sister",
    "Son",
    "Daughter",
    "Spouse",
    "Partner",
    "Friend",
    "Doctor",
    "Caregiver",
    "Neighbor",
    "Other"
]

# Phone validation utility
def validate_phone_number(phone: str) -> bool:
    """
    Validate phone number format.
    Accepts formats like: +1234567890, (123) 456-7890, 123-456-7890, 1234567890
    """
    # Remove common separators and spaces
    cleaned = re.sub(r'[\s\-\(\)]', '', phone)
    
    # Check if it contains only digits and optional leading +
    pattern = r'^\+?\d{10,15}$'
    return bool(re.match(pattern, cleaned))

# Request/Response Models
class CreateLinkedConnectionRequest(BaseModel):
    connected_user_id: str
    relationship: str

class CreateExternalContactRequest(BaseModel):
    name: str
    phone: str
    address: Optional[str] = None
    relationship: str

class CreateExternalContactResponse(BaseModel):
    success: bool
    contact_id: str
    message: str

class LinkedConnectionResponse(BaseModel):
    id: str
    user_id: str
    connected_user_id: str
    relationship: str
    created_at: str

class CreateLinkedConnectionResponse(BaseModel):
    success: bool
    connection_id: str
    message: str

@router.post("/linked", response_model=CreateLinkedConnectionResponse)
async def create_linked_connection(
    request: CreateLinkedConnectionRequest,
    current_user_id: str = Depends(get_current_user)
):
    """
    Create a bidirectional linked connection between two registered users.
    
    - **connected_user_id**: ID of the user to connect with
    - **relationship**: Type of relationship (must be from predefined list)
    
    Creates two connection records (bidirectional) and validates:
    - Connected user exists
    - Relationship type is valid
    - No duplicate connections
    - No self-connections
    """
    supabase = get_supabase_service()
    
    try:
        # Validate relationship type
        if request.relationship not in RELATIONSHIP_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid relationship type. Must be one of: {', '.join(RELATIONSHIP_TYPES)}"
            )
        
        # Check for self-connection attempt
        if current_user_id == request.connected_user_id:
            raise HTTPException(
                status_code=400,
                detail="Cannot create a connection to yourself"
            )
        
        # Validate that connected user exists
        user_check = supabase.client.table('users').select('id').eq('id', request.connected_user_id).execute()
        if not user_check.data:
            raise HTTPException(
                status_code=404,
                detail="Connected user not found"
            )
        
        # Check for duplicate connection (either direction)
        existing_connection = supabase.client.table('user_connections').select('id').or_(
            f"and(user_id.eq.{current_user_id},connected_user_id.eq.{request.connected_user_id}),"
            f"and(user_id.eq.{request.connected_user_id},connected_user_id.eq.{current_user_id})"
        ).execute()
        
        if existing_connection.data:
            raise HTTPException(
                status_code=409,
                detail="Connection already exists between these users"
            )
        
        # Create bidirectional connections
        connections_data = [
            {
                "user_id": current_user_id,
                "connected_user_id": request.connected_user_id,
                "relationship": request.relationship
            },
            {
                "user_id": request.connected_user_id,
                "connected_user_id": current_user_id,
                "relationship": request.relationship
            }
        ]
        
        response = supabase.client.table('user_connections').insert(connections_data).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to create connection"
            )
        
        # Return the first connection ID (the one created by current user)
        connection_id = response.data[0]['id']
        
        return CreateLinkedConnectionResponse(
            success=True,
            connection_id=connection_id,
            message="Connection created successfully"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create linked connection: {str(e)}"
        )


@router.post("/external", response_model=CreateExternalContactResponse)
async def create_external_contact(
    request: CreateExternalContactRequest,
    current_user_id: str = Depends(get_current_user)
):
    """
    Create an external contact (person not registered in the system).
    
    - **name**: Full name of the contact (required)
    - **phone**: Phone number (required, validated)
    - **address**: Physical address (optional)
    - **relationship**: Type of relationship (must be from predefined list)
    
    Saves to relatives table with is_external = TRUE
    """
    supabase = get_supabase_service()
    
    try:
        # Validate required fields
        if not request.name or len(request.name.strip()) < 2:
            raise HTTPException(
                status_code=400,
                detail="Name is required and must be at least 2 characters"
            )
        
        if not request.phone:
            raise HTTPException(
                status_code=400,
                detail="Phone number is required"
            )
        
        # Validate phone number format
        if not validate_phone_number(request.phone):
            raise HTTPException(
                status_code=400,
                detail="Invalid phone number format. Please provide a valid phone number (10-15 digits)"
            )
        
        # Validate relationship type
        if request.relationship not in RELATIONSHIP_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid relationship type. Must be one of: {', '.join(RELATIONSHIP_TYPES)}"
            )
        
        # Create external contact in relatives table
        contact_data = {
            "user_id": current_user_id,
            "name": request.name.strip(),
            "phone": request.phone.strip(),
            "relation": request.relationship,
            "is_external": True
        }
        
        # Add address if provided
        if request.address and request.address.strip():
            contact_data["address"] = request.address.strip()
        
        response = supabase.client.table('relatives').insert(contact_data).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to create external contact"
            )
        
        contact_id = response.data[0]['id']
        
        return CreateExternalContactResponse(
            success=True,
            contact_id=str(contact_id),
            message="External contact created successfully"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create external contact: {str(e)}"
        )


# Response models for get connections
class ConnectedUser(BaseModel):
    id: str
    name: str
    email: str

class LinkedConnection(BaseModel):
    id: str
    connected_user: ConnectedUser
    relationship: str
    created_at: str

class ExternalContact(BaseModel):
    id: int
    name: str
    phone: str
    address: Optional[str]
    relationship: str
    created_at: Optional[str]

class GetConnectionsResponse(BaseModel):
    linked_connections: List[LinkedConnection]
    external_contacts: List[ExternalContact]

class UpdateLinkedConnectionRequest(BaseModel):
    relationship: str

class UpdateExternalContactRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    relationship: Optional[str] = None

class UpdateConnectionResponse(BaseModel):
    success: bool
    message: str

class DeleteConnectionResponse(BaseModel):
    success: bool
    message: str

@router.get("/{user_id}", response_model=GetConnectionsResponse)
async def get_all_connections(user_id: str):
    """
    Get all connections for a user (both linked and external).
    
    - **user_id**: ID of the user whose connections to fetch
    
    Returns:
    - linked_connections: Array of connections to registered users with their details
    - external_contacts: Array of external contacts (not registered users)
    """
    supabase = get_supabase_service()
    
    try:
        # Fetch linked connections with user details
        linked_response = supabase.client.table('user_connections').select(
            'id, connected_user_id, relationship, created_at'
        ).eq('user_id', user_id).execute()
        
        linked_connections = []
        
        if linked_response.data:
            # For each linked connection, fetch the connected user's details
            for connection in linked_response.data:
                user_response = supabase.client.table('users').select(
                    'id, name, email'
                ).eq('id', connection['connected_user_id']).execute()
                
                if user_response.data:
                    user_data = user_response.data[0]
                    linked_connections.append(
                        LinkedConnection(
                            id=connection['id'],
                            connected_user=ConnectedUser(
                                id=user_data['id'],
                                name=user_data['name'],
                                email=user_data['email']
                            ),
                            relationship=connection['relationship'],
                            created_at=connection['created_at']
                        )
                    )
        
        # Fetch external contacts (where is_external = TRUE)
        external_response = supabase.client.table('relatives').select(
            'id, name, phone, address, relation, created_at'
        ).eq('user_id', user_id).eq('is_external', True).execute()
        
        external_contacts = []
        
        if external_response.data:
            for contact in external_response.data:
                external_contacts.append(
                    ExternalContact(
                        id=contact['id'],
                        name=contact['name'],
                        phone=contact['phone'],
                        address=contact.get('address'),
                        relationship=contact['relation'],
                        created_at=contact.get('created_at')
                    )
                )
        
        return GetConnectionsResponse(
            linked_connections=linked_connections,
            external_contacts=external_contacts
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch connections: {str(e)}"
        )


@router.put("/linked/{connection_id}", response_model=UpdateConnectionResponse)
async def update_linked_connection(
    connection_id: str,
    request: UpdateLinkedConnectionRequest,
    current_user_id: str = Depends(get_current_user)
):
    """
    Update a linked connection's relationship type.
    
    - **connection_id**: ID of the linked connection to update
    - **relationship**: New relationship type
    
    Validates ownership before allowing update.
    Updates both bidirectional connection records.
    """
    supabase = get_supabase_service()
    
    try:
        # Find the linked connection
        linked_check = supabase.client.table('user_connections').select(
            'id, user_id, connected_user_id, relationship'
        ).eq('id', connection_id).execute()
        
        if not linked_check.data:
            raise HTTPException(
                status_code=404,
                detail="Linked connection not found"
            )
        
        connection = linked_check.data[0]
        
        # Validate ownership
        if connection['user_id'] != current_user_id:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to update this connection"
            )
        
        # Validate relationship type
        if request.relationship not in RELATIONSHIP_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid relationship type. Must be one of: {', '.join(RELATIONSHIP_TYPES)}"
            )
        
        # Update both bidirectional records
        # Update the current user's connection
        supabase.client.table('user_connections').update({
            'relationship': request.relationship
        }).eq('id', connection_id).execute()
        
        # Update the reverse connection
        supabase.client.table('user_connections').update({
            'relationship': request.relationship
        }).eq('user_id', connection['connected_user_id']).eq(
            'connected_user_id', current_user_id
        ).execute()
        
        return UpdateConnectionResponse(
            success=True,
            message="Linked connection updated successfully"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update linked connection: {str(e)}"
        )


@router.put("/external/{contact_id}", response_model=UpdateConnectionResponse)
async def update_external_contact(
    contact_id: int,
    request: UpdateExternalContactRequest,
    current_user_id: str = Depends(get_current_user)
):
    """
    Update an external contact's information.
    
    - **contact_id**: ID of the external contact to update
    - **name**: Updated name (optional)
    - **phone**: Updated phone number (optional)
    - **address**: Updated address (optional)
    - **relationship**: Updated relationship type (optional)
    
    Validates ownership before allowing update.
    All fields are optional - only provided fields will be updated.
    """
    supabase = get_supabase_service()
    
    try:
        # Find the external contact
        external_check = supabase.client.table('relatives').select(
            'id, user_id, name, phone, address, relation'
        ).eq('id', contact_id).eq('is_external', True).execute()
        
        if not external_check.data:
            raise HTTPException(
                status_code=404,
                detail="External contact not found"
            )
        
        contact = external_check.data[0]
        
        # Validate ownership
        if contact['user_id'] != current_user_id:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to update this contact"
            )
        
        # Build update data
        update_data = {}
        
        if request.name is not None:
            if len(request.name.strip()) < 2:
                raise HTTPException(
                    status_code=400,
                    detail="Name must be at least 2 characters"
                )
            update_data['name'] = request.name.strip()
        
        if request.phone is not None:
            if not validate_phone_number(request.phone):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid phone number format"
                )
            update_data['phone'] = request.phone.strip()
        
        if request.address is not None:
            update_data['address'] = request.address.strip() if request.address.strip() else None
        
        if request.relationship is not None:
            if request.relationship not in RELATIONSHIP_TYPES:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid relationship type. Must be one of: {', '.join(RELATIONSHIP_TYPES)}"
                )
            update_data['relation'] = request.relationship
        
        # Ensure at least one field is being updated
        if not update_data:
            raise HTTPException(
                status_code=400,
                detail="At least one field must be provided for update"
            )
        
        # Perform update
        supabase.client.table('relatives').update(update_data).eq('id', contact_id).execute()
        
        return UpdateConnectionResponse(
            success=True,
            message="External contact updated successfully"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update external contact: {str(e)}"
        )


@router.delete("/{connection_id}", response_model=DeleteConnectionResponse)
async def delete_connection(
    connection_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """
    Delete a connection (either linked or external).
    
    - **connection_id**: ID of the connection to delete
    
    Automatically determines if the connection is:
    - Linked connection: Deletes both bidirectional records
    - External contact: Deletes single record
    
    Validates ownership before allowing deletion.
    """
    supabase = get_supabase_service()
    
    try:
        # First, try to find as a linked connection (UUID format)
        try:
            linked_check = supabase.client.table('user_connections').select(
                'id, user_id, connected_user_id'
            ).eq('id', connection_id).execute()
            
            if linked_check.data:
                connection = linked_check.data[0]
                
                # Validate ownership
                if connection['user_id'] != current_user_id:
                    raise HTTPException(
                        status_code=403,
                        detail="You do not have permission to delete this connection"
                    )
                
                # Delete both bidirectional records
                supabase.client.table('user_connections').delete().eq('id', connection_id).execute()
                
                # Delete the reverse connection
                supabase.client.table('user_connections').delete().eq(
                    'user_id', connection['connected_user_id']
                ).eq('connected_user_id', current_user_id).execute()
                
                return DeleteConnectionResponse(
                    success=True,
                    message="Connection deleted successfully"
                )
        except Exception:
            # Not a linked connection, continue to check external
            pass
        
        # Try to find as an external contact (integer ID)
        try:
            contact_id = int(connection_id)
            external_check = supabase.client.table('relatives').select(
                'id, user_id'
            ).eq('id', contact_id).eq('is_external', True).execute()
            
            if external_check.data:
                contact = external_check.data[0]
                
                # Validate ownership
                if contact['user_id'] != current_user_id:
                    raise HTTPException(
                        status_code=403,
                        detail="You do not have permission to delete this contact"
                    )
                
                # Delete the external contact
                supabase.client.table('relatives').delete().eq('id', contact_id).execute()
                
                return DeleteConnectionResponse(
                    success=True,
                    message="Connection deleted successfully"
                )
        except ValueError:
            # Not a valid integer, skip external contact check
            pass
        
        # Connection not found in either table
        raise HTTPException(
            status_code=404,
            detail="Connection not found"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete connection: {str(e)}"
        )
