from typing import List, Optional, Dict, Any
from dataclasses import dataclass
from datetime import datetime
from fastapi import HTTPException
from services.storage_service import get_supabase_service, SupabaseService
from models.connections import (
    CreateLinkedConnectionRequest,
    CreateExternalContactRequest,
    CreateLinkedConnectionResponse,
    CreateExternalContactResponse,
    GetConnectionsResponse,
    UpdateLinkedConnectionRequest,
    UpdateExternalContactRequest,
    UpdateConnectionResponse,
    DeleteConnectionResponse,
    LinkedConnection,
    ExternalContact,
    ConnectedUser
)
from utils.error_handlers import service_guard
from utils.validation import validate_phone, ValidationError

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

@dataclass
class RelationshipQueryConfig:
    table: str
    match_col: str
    target_col: str
    status: Optional[str] = None

class ConnectionService:
    def __init__(self):
        self.supabase: SupabaseService = get_supabase_service()

    def validate_relationship(self, relationship: str) -> bool:
        return relationship in RELATIONSHIP_TYPES

    def validate_phone_number(self, phone: str) -> bool:
        """
        Validate phone number format.
        Accepts formats like: +1234567890, (123) 456-7890, 123-456-7890, 1234567890
        """
        if not phone:
            return False
        try:
             validate_phone(phone)
             return True
        except ValidationError:
             return False

    def _validate_name(self, name: Optional[str]):
        if name is not None and len(name.strip()) < 2:
            raise HTTPException(status_code=400, detail="Name is required and must be at least 2 characters")

    def _validate_phone(self, phone: Optional[str]):
        if phone is None:
            return
        if not phone:
            raise HTTPException(status_code=400, detail="Phone number is required")
        try:
            validate_phone(phone)
        except ValidationError:
            raise HTTPException(status_code=400, detail="Invalid phone number format. Please provide a valid phone number (10-15 digits)")

    def _validate_relationship_input(self, relationship: Optional[str]):
        if relationship is not None and not self.validate_relationship(relationship):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid relationship type. Must be one of: {', '.join(RELATIONSHIP_TYPES)}"
            )

    def _validate_contact_inputs(self, name: Optional[str] = None, phone: Optional[str] = None, relationship: Optional[str] = None):
        """Helper to validate contact inputs to reduce method complexity"""
        self._validate_name(name)
        self._validate_phone(phone)
        self._validate_relationship_input(relationship)

    def _check_self_connection(self, user_id: str, other_id: str):
        if user_id == other_id:
            raise HTTPException(status_code=400, detail="Cannot connect to yourself")

    def _check_incoming_request(self, sender_id: str, receiver_id: str):
        incoming_req = self.supabase.client.table('connection_requests').select('id').eq(
            'sender_id', receiver_id
        ).eq('receiver_id', sender_id).eq('status', 'pending').execute()
        
        if incoming_req.data:
            raise HTTPException(
                status_code=409, 
                detail="This user has already sent you a connection request. Please check your pending requests."
            )

    async def _handle_existing_outgoing_request(self, existing: Dict[str, Any], relationship: str) -> CreateLinkedConnectionResponse:
        if existing['status'] == 'pending':
            raise HTTPException(status_code=409, detail="Request already sent")
        
        # Update existing (rejected/accepted) request to pending
        update_data = {
            "status": "pending",
            "relationship": relationship,
            "created_at": datetime.utcnow().isoformat()
        }
        self.supabase.client.table('connection_requests').update(update_data).eq('id', existing['id']).execute()
        return CreateLinkedConnectionResponse(
            success=True, 
            message="Connection request sent successfully", 
            request_id=existing['id']
        )

    async def _check_and_handle_outgoing_request(self, sender_id: str, receiver_id: str, relationship: str) -> Optional[CreateLinkedConnectionResponse]:
        outgoing_req = self.supabase.client.table('connection_requests').select('id, status').eq(
            'sender_id', sender_id
        ).eq('receiver_id', receiver_id).execute()
        
        if outgoing_req.data:
            return await self._handle_existing_outgoing_request(outgoing_req.data[0], relationship)
        return None

    def _ensure_no_existing_connection(self, user_id: str, connected_user_id: str):
        existing_connection = self.supabase.client.table('user_connections').select('id').eq(
            'user_id', user_id
        ).eq('connected_user_id', connected_user_id).execute()
        
        if existing_connection.data:
            raise HTTPException(status_code=409, detail="Connection already exists")

    @service_guard("Failed to create connection request")
    async def create_connection_request(self, sender_id: str, request: CreateLinkedConnectionRequest) -> CreateLinkedConnectionResponse:
        receiver_id = request.connected_user_id
        relationship = request.relationship
        
        self._validate_relationship_input(relationship)
        self._check_self_connection(sender_id, receiver_id)
        self._ensure_no_existing_connection(sender_id, receiver_id)
        self._check_incoming_request(sender_id, receiver_id)

        # Handle outgoing requests
        existing_result = await self._check_and_handle_outgoing_request(sender_id, receiver_id, relationship)
        if existing_result:
            return existing_result

        # Create new request
        new_req = self.supabase.client.table('connection_requests').insert({
            "sender_id": sender_id,
            "receiver_id": receiver_id,
            "relationship": relationship,
            "status": "pending"
        }).execute()
        
        if not new_req.data:
            raise HTTPException(status_code=500, detail="Failed to create request")
            
        return CreateLinkedConnectionResponse(
            success=True, 
            message="Connection request sent successfully", 
            request_id=new_req.data[0]['id']
        )

    def get_emergency_contacts(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Fetch all emergency contacts for a user, combining:
        1. External contacts (from relatives table)
        2. Linked connections who have a phone number (from user_connections join users)
        
        Returns a unified list of contact dictionaries.
        """
        contacts = []
        
        # 1. External contacts
        external = self._fetch_external_contacts(user_id)
        for ext in external:
            contacts.append({
                "id": ext.id,
                "name": ext.name,
                "relation": ext.relationship,
                "phone": ext.phone,
                "address": ext.address,
                "type": "external"
            })
            
        # 2. Linked connections
        linked = self._fetch_linked_connections(user_id)
        for link in linked:
            # Only include if user has a phone number
            if link.connected_user.phone:
                contacts.append({
                    "id": None, # No 'relatives' table ID for linked users
                    "name": link.connected_user.name,
                    "relation": link.relationship,
                    "phone": link.connected_user.phone,
                    "address": None, # Linked users don't have an address in this context
                    "type": "linked"
                })
                
        return contacts

    @service_guard("Failed to replace relatives")
    async def replace_user_relatives(self, user_id: str, relatives_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Replace all external contacts (relatives) for a user.
        Used by profile update features.
        """
        # Delete existing relatives
        self.supabase.client.table('relatives').delete().eq('user_id', user_id).execute()
        
        # Insert new relatives
        if relatives_data:
            # Ensure user_id is set
            for relative in relatives_data:
                relative['user_id'] = user_id
                
            response = self.supabase.client.table('relatives').insert(relatives_data).execute()
            return response.data or []
        
        return []

    @service_guard("Failed to fetch pending requests")
    async def get_pending_requests(self, user_id: str) -> List[Dict[str, Any]]:
        # Keeping return type as List[Dict] for now to avoid complexity in mapping nested user object to model inside service
        # The router will handle the mapping to ConnectionRequestResponse
        response = self.supabase.client.table('connection_requests').select(
            'id, sender_id, relationship, status, created_at, users:sender_id(name, email)'
        ).eq('receiver_id', user_id).eq('status', 'pending').execute()
        return response.data if response.data else []

    @service_guard("Failed to accept request")
    async def accept_request(self, request_id: str, user_id: str) -> CreateLinkedConnectionResponse:
        req_res = self.supabase.client.table('connection_requests').select('*').eq('id', request_id).execute()
        if not req_res.data:
            raise HTTPException(status_code=404, detail="Request not found")
            
        request = req_res.data[0]
        if request['receiver_id'] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        connections = [
            {"user_id": request['sender_id'], "connected_user_id": request['receiver_id'], "relationship": request['relationship']},
            {"user_id": request['receiver_id'], "connected_user_id": request['sender_id'], "relationship": request['relationship']}
        ]

        self.supabase.client.table('user_connections').insert(connections).execute()
        self.supabase.client.table('connection_requests').update({"status": "accepted"}).eq('id', request_id).execute()
        return CreateLinkedConnectionResponse(success=True, message="Connection accepted")

    @service_guard("Failed to reject request")
    async def reject_request(self, request_id: str, user_id: str) -> CreateLinkedConnectionResponse:
        self.supabase.client.table('connection_requests').update({"status": "rejected"}).eq('id', request_id).eq('receiver_id', user_id).execute()
        return CreateLinkedConnectionResponse(success=True, message="Connection rejected")

    def _check_bidirectional_conflict(self, user_id: str, connected_user_id: str):
        # Check both directions in a single query using OR
        # (user_id = A AND connected_user_id = B) OR (user_id = B AND connected_user_id = A)
        or_condition = f"and(user_id.eq.{user_id},connected_user_id.eq.{connected_user_id}),and(user_id.eq.{connected_user_id},connected_user_id.eq.{user_id})"
        
        existing = self.supabase.client.table('user_connections').select('id').or_(or_condition).execute()
        
        if existing.data:
            raise HTTPException(status_code=409, detail="Connection already exists between these users")

    def _verify_connected_user_exists(self, connected_user_id: str):
        if not self.supabase.get_user(connected_user_id):
            raise HTTPException(status_code=404, detail="Connected user not found")

    @service_guard("Failed to create connection")
    async def create_linked_connection(self, user_id: str, request: CreateLinkedConnectionRequest) -> CreateLinkedConnectionResponse:
        connected_user_id = request.connected_user_id
        relationship = request.relationship
        
        self._validate_relationship_input(relationship)
        self._check_self_connection(user_id, connected_user_id)
        self._verify_connected_user_exists(connected_user_id)
        self._check_bidirectional_conflict(user_id, connected_user_id)
        
        connections_data = [
            {"user_id": user_id, "connected_user_id": connected_user_id, "relationship": relationship},
            {"user_id": connected_user_id, "connected_user_id": user_id, "relationship": relationship}
        ]
        
        response = self.supabase.client.table('user_connections').insert(connections_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create connection")
        
        return CreateLinkedConnectionResponse(
            success=True,
            connection_id=response.data[0]['id'],
            message="Connection created successfully"
        )

    @service_guard("Failed to create external contact")
    async def create_external_contact(self, user_id: str, request: CreateExternalContactRequest) -> CreateExternalContactResponse:
        self._validate_contact_inputs(request.name, request.phone, request.relationship)
        
        contact_data = {
            "user_id": user_id,
            "name": request.name.strip(),
            "phone": request.phone.strip(),
            "relation": request.relationship,
            "is_external": True
        }
        
        if request.address and request.address.strip():
            contact_data["address"] = request.address.strip()
        
        response = self.supabase.client.table('relatives').insert(contact_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create external contact")
        
        return CreateExternalContactResponse(
            success=True,
            contact_id=str(response.data[0]['id']),
            message="External contact created successfully"
        )

    def _fetch_linked_connections(self, user_id: str) -> List[LinkedConnection]:
        # Use Supabase join to fetch connected user details in a single query
        linked_response = self.supabase.client.table('user_connections').select(
            'id, relationship, created_at, connected_user:connected_user_id(id, name, email, phone)'
        ).eq('user_id', user_id).execute()
        
        linked_connections = []
        if linked_response.data:
            for connection in linked_response.data:
                user_data = connection['connected_user']
                # Supabase might return single object or list depending on relationship, assume object here
                if user_data:
                    linked_connections.append(LinkedConnection(
                        id=connection['id'],
                        connected_user=ConnectedUser(
                            id=user_data['id'],
                            name=user_data['name'],
                            email=user_data['email'],
                            phone=user_data.get('phone')
                        ),
                        relationship=connection['relationship'],
                        created_at=connection['created_at']
                    ))
        return linked_connections

    def _fetch_external_contacts(self, user_id: str) -> List[ExternalContact]:
        external_response = self.supabase.client.table('relatives').select(
            'id, name, phone, address, relation, created_at'
        ).eq('user_id', user_id).eq('is_external', True).execute()
        
        external_contacts = []
        if external_response.data:
            for contact in external_response.data:
                external_contacts.append(ExternalContact(
                    id=contact['id'],
                    name=contact['name'],
                    phone=contact['phone'],
                    address=contact.get('address'),
                    relationship=contact['relation'],
                    created_at=contact.get('created_at')
                ))
        return external_contacts

    @service_guard("Failed to fetch connections")
    async def get_all_connections(self, user_id: str) -> GetConnectionsResponse:
        return GetConnectionsResponse(
            linked_connections=self._fetch_linked_connections(user_id),
            external_contacts=self._fetch_external_contacts(user_id)
        )

    def _get_and_verify_connection(self, connection_id: str, user_id: str) -> Dict[str, Any]:
        linked_check = self.supabase.client.table('user_connections').select(
            'id, user_id, connected_user_id, relationship'
        ).eq('id', connection_id).execute()
        
        if not linked_check.data:
            raise HTTPException(status_code=404, detail="Linked connection not found")
        
        connection = linked_check.data[0]
        if connection['user_id'] != user_id:
            raise HTTPException(status_code=403, detail="You do not have permission to update this connection")
        return connection

    def _update_bidirectional_records(self, connection_id: str, user_id: str, connected_user_id: str, relationship: str):
        self.supabase.client.table('user_connections').update({
            'relationship': relationship
        }).eq('id', connection_id).execute()
        
        self.supabase.client.table('user_connections').update({
            'relationship': relationship
        }).eq('user_id', connected_user_id).eq(
            'connected_user_id', user_id
        ).execute()

    @service_guard("Failed to update connection")
    async def update_linked_connection(self, connection_id: str, user_id: str, request: UpdateLinkedConnectionRequest) -> UpdateConnectionResponse:
        relationship = request.relationship
        connection = self._get_and_verify_connection(connection_id, user_id)
        self._validate_relationship_input(relationship)
        self._update_bidirectional_records(connection_id, user_id, connection['connected_user_id'], relationship)
        return UpdateConnectionResponse(success=True, message="Linked connection updated successfully")

    def _prepare_update_data(self, updates: UpdateExternalContactRequest) -> Dict[str, Any]:
        update_data = {}
        
        if updates.name is not None:
            update_data['name'] = updates.name.strip()
            
        if updates.phone is not None:
            update_data['phone'] = updates.phone.strip()
            
        if updates.address is not None:
            update_data['address'] = updates.address.strip() if updates.address.strip() else None
            
        if updates.relationship is not None:
            update_data['relation'] = updates.relationship
            
        return update_data

    @service_guard("Failed to update external contact")
    async def update_external_contact(self, contact_id: str, user_id: str, updates: UpdateExternalContactRequest) -> UpdateConnectionResponse:
        external_check = self.supabase.client.table('relatives').select(
            'id, user_id'
        ).eq('id', contact_id).eq('is_external', True).execute()
        
        if not external_check.data:
            raise HTTPException(status_code=404, detail="External contact not found")
        
        if external_check.data[0]['user_id'] != user_id:
            raise HTTPException(status_code=403, detail="You do not have permission to update this contact")
            
        # Use helper for validation if fields are present
        if any([updates.name, updates.phone, updates.relationship]):
            self._validate_contact_inputs(
                name=updates.name,
                phone=updates.phone,
                relationship=updates.relationship
            )

        update_data = self._prepare_update_data(updates)
        
        if not update_data:
            raise HTTPException(status_code=400, detail="At least one field must be provided for update")
            
        self.supabase.client.table('relatives').update(update_data).eq('id', contact_id).execute()
        return UpdateConnectionResponse(success=True, message="External contact updated successfully")

    async def _delete_linked_connection(self, connection: Dict, user_id: str) -> DeleteConnectionResponse:
        if connection['user_id'] != user_id:
            raise HTTPException(status_code=403, detail="You do not have permission to delete this connection")
        
        connection_id = connection['id']
        # Delete bidirectional
        self.supabase.client.table('user_connections').delete().eq('id', connection_id).execute()
        self.supabase.client.table('user_connections').delete().eq(
            'user_id', connection['connected_user_id']
        ).eq('connected_user_id', user_id).execute()
        
        # Clean up requests
        self.supabase.client.table('connection_requests').delete().eq(
            'sender_id', user_id
        ).eq('receiver_id', connection['connected_user_id']).execute()
        
        self.supabase.client.table('connection_requests').delete().eq(
            'sender_id', connection['connected_user_id']
        ).eq('receiver_id', user_id).execute()
        
        return DeleteConnectionResponse(success=True, message="Connection deleted successfully")

    async def _delete_external_contact(self, contact: Dict, user_id: str) -> DeleteConnectionResponse:
        if contact['user_id'] != user_id:
            raise HTTPException(status_code=403, detail="You do not have permission to delete this contact")
        
        self.supabase.client.table('relatives').delete().eq('id', contact['id']).execute()
        return DeleteConnectionResponse(success=True, message="Connection deleted successfully")

    @service_guard("Failed to delete connection")
    async def delete_connection(self, connection_id: str, user_id: str) -> DeleteConnectionResponse:
        # Check linked connection first
        linked_check = self.supabase.client.table('user_connections').select(
            'id, user_id, connected_user_id'
        ).eq('id', connection_id).execute()
        
        if linked_check.data:
            return await self._delete_linked_connection(linked_check.data[0], user_id)

        # Check external contact
        external_check = self.supabase.client.table('relatives').select(
            'id, user_id'
        ).eq('id', connection_id).eq('is_external', True).execute()
        
        if external_check.data:
            return await self._delete_external_contact(external_check.data[0], user_id)

        raise HTTPException(status_code=404, detail="Connection not found")

    def _batch_fetch_relationships(self, config: RelationshipQueryConfig, match_id: str, target_ids: List[str]) -> List[str]:
        """Helper to fetch related IDs in batch."""
        query = self.supabase.client.table(config.table).select(config.target_col).eq(config.match_col, match_id).in_(config.target_col, target_ids)
        if config.status:
            query = query.eq('status', config.status)
        result = query.execute()
        return [item[config.target_col] for item in result.data or []]

    def get_connection_statuses(self, current_user_id: str, target_user_ids: List[str]) -> Dict[str, str]:
        """
        Check connection statuses between current user and a list of target users.
        Returns a dictionary mapping target_user_id -> status string.
        Statuses: "connected", "pending_sent", "pending_received", "none"
        """
        if not current_user_id or not target_user_ids:
            return {}
            
        user_statuses = {}
        try:
            # 1. Check existing connections
            conn_config = RelationshipQueryConfig('user_connections', 'user_id', 'connected_user_id')
            for uid in self._batch_fetch_relationships(conn_config, current_user_id, target_user_ids):
                user_statuses[uid] = "connected"

            # 2. Check sent requests (pending)
            sent_config = RelationshipQueryConfig('connection_requests', 'sender_id', 'receiver_id', 'pending')
            for uid in self._batch_fetch_relationships(sent_config, current_user_id, target_user_ids):
                user_statuses[uid] = "pending_sent"

            # 3. Check received requests (pending)
            recv_config = RelationshipQueryConfig('connection_requests', 'receiver_id', 'sender_id', 'pending')
            for uid in self._batch_fetch_relationships(recv_config, current_user_id, target_user_ids):
                user_statuses.setdefault(uid, "pending_received")
                
        except Exception as e:
            print(f"Error checking connection statuses: {e}")
            
        return user_statuses
