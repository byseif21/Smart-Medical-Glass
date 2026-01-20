from typing import List, Dict, Any

def get_emergency_contacts(supabase_client, user_id: str) -> List[Dict[str, Any]]:
    """
    Fetch all emergency contacts for a user, combining:
    1. External contacts (from relatives table)
    2. Linked connections who have a phone number (from user_connections join users)
    
    Returns a unified list of contact dictionaries with keys:
    id, name, relation, phone, address
    """
    contacts = []
    
    # 1. Fetch external contacts
    try:
        external_res = supabase_client.table('relatives').select('*').eq('user_id', user_id).execute()
        if external_res.data:
            contacts.extend(external_res.data)
    except Exception as e:
        print(f"Error fetching external contacts: {e}")

    # 2. Fetch linked connections with phone numbers using a join
    try:
        # Fetch relationship and joined user details (name, phone)
        # Using the foreign key column 'connected_user_id' to join with 'users' table
        linked_res = supabase_client.table('user_connections').select(
            'relationship, users:connected_user_id(name, phone)'
        ).eq('user_id', user_id).execute()

        if linked_res.data:
            for conn in linked_res.data:
                user_data = conn.get('users')
                # Only include if user data exists and has a phone number
                if user_data and user_data.get('phone'):
                    contacts.append({
                        "id": None, # No 'relatives' table ID for linked users
                        "name": user_data['name'],
                        "relation": conn['relationship'],
                        "phone": user_data['phone'],
                        "address": None,
                        "type": "linked" # Optional: to distinguish source
                    })
    except Exception as e:
        print(f"Error fetching linked contacts: {e}")

    return contacts
