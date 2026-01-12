import { useState, useEffect } from 'react';
import {
  getConnections,
  createLinkedConnection,
  createExternalContact,
  updateConnection,
  deleteConnection,
  getPendingRequests,
  acceptConnectionRequest,
  rejectConnectionRequest,
} from '../services/api';
import ConnectionCard from './ConnectionCard';
import AddConnectionModal from './AddConnectionModal';
import LoadingSpinner from './LoadingSpinner';

const Connections = () => {
  const [loading, setLoading] = useState(false);
  const [linkedConnections, setLinkedConnections] = useState([]);
  const [externalContacts, setExternalContacts] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const userId = localStorage.getItem('user_id');

  // Fetch connections on mount
  useEffect(() => {
    fetchConnections();
    fetchPendingRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConnections = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getConnections(userId);

      if (result.success) {
        setLinkedConnections(result.data.linked_connections || []);
        setExternalContacts(result.data.external_contacts || []);
      } else {
        setError(result.error || 'Failed to load connections. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching connections:', err);
      setError('An unexpected error occurred while loading connections. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const result = await getPendingRequests();
      if (result.success) {
        setPendingRequests(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching pending requests:', err);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const result = await acceptConnectionRequest(requestId);
      if (result.success) {
        setSuccessMessage('Connection request accepted!');
        await fetchConnections();
        await fetchPendingRequests();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error || 'Failed to accept request');
      }
    } catch (err) {
      console.error('Error accepting request:', err);
      setError('Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const result = await rejectConnectionRequest(requestId);
      if (result.success) {
        setSuccessMessage('Connection request rejected');
        await fetchPendingRequests();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error || 'Failed to reject request');
      }
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError('Failed to reject request');
    }
  };

  const handleAddConnection = async (connectionData) => {
    setError(null);

    try {
      let result;

      if (connectionData.type === 'linked') {
        result = await createLinkedConnection({
          connected_user_id: connectionData.connected_user_id,
          relationship: connectionData.relationship,
        });
      } else {
        result = await createExternalContact({
          name: connectionData.name,
          phone: connectionData.phone,
          address: connectionData.address,
          relationship: connectionData.relationship,
        });
      }

      if (result.success) {
        const message =
          connectionData.type === 'linked'
            ? 'Connection request sent successfully! Waiting for approval.'
            : 'Contact added successfully!';

        setSuccessMessage(message);
        setShowAddModal(false);
        setEditingContact(null);
        await fetchConnections();

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setError(result.error || 'Failed to add connection. Please try again.');
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error adding connection:', err);
      if (!error) {
        setError('An unexpected error occurred. Please check your connection and try again.');
      }
    }
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setShowAddModal(true);
  };

  const handleUpdateContact = async (contactId, updatedData, connectionType) => {
    setError(null);

    try {
      const result = await updateConnection(contactId, updatedData, connectionType);

      if (result.success) {
        setSuccessMessage('Connection updated successfully!');
        setEditingContact(null);
        setShowAddModal(false);
        await fetchConnections();

        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error || 'Failed to update connection. Please try again.');
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error updating connection:', err);
      if (!error) {
        setError('An unexpected error occurred. Please check your connection and try again.');
      }
    }
  };

  const handleRemoveConnection = async (connection) => {
    // Custom confirmation dialog
    const confirmDelete = window.confirm(
      `Are you sure you want to remove ${connection.name || connection.connected_user?.name}?\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) {
      return;
    }

    setError(null);

    try {
      const result = await deleteConnection(connection.id);

      if (result.success) {
        setSuccessMessage(
          'Connection removed successfully! Any pending requests have also been cleared.'
        );
        await fetchConnections();

        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setError(result.error || 'Failed to remove connection. Please try again.');
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error removing connection:', err);
      if (!error) {
        setError('An unexpected error occurred. Please check your connection and try again.');
      }
    }
  };

  const allConnectionsCount = linkedConnections.length + externalContacts.length;

  if (loading && allConnectionsCount === 0) {
    return (
      <div className="medical-card">
        <LoadingSpinner text="Loading connections..." />
      </div>
    );
  }

  return (
    <div className="medical-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Family Connections</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-medical-primary text-sm px-4 py-2 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Connection
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </div>
      )}

      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <div className="mb-8 p-4 bg-medical-light/30 border border-medical-primary/20 rounded-xl">
          <h3 className="text-lg font-semibold text-medical-dark mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-medical-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            Pending Connection Requests ({pendingRequests.length})
          </h3>
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 bg-white border border-medical-gray-200 rounded-lg shadow-sm"
              >
                <div>
                  <p className="font-medium text-medical-dark">{request.sender_name}</p>
                  <p className="text-xs text-medical-gray-500">{request.sender_email}</p>
                  <p className="text-sm text-medical-primary font-medium mt-1">
                    Wants to connect as: {request.relationship}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptRequest(request.id)}
                    className="px-3 py-1.5 bg-medical-primary text-white text-sm font-medium rounded-md hover:bg-medical-primary-dark transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request.id)}
                    className="px-3 py-1.5 bg-medical-gray-100 text-medical-gray-700 text-sm font-medium rounded-md hover:bg-medical-gray-200 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linked Connections Section */}
      {linkedConnections.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-medical-dark mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-medical-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            Linked Connections ({linkedConnections.length})
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {linkedConnections.map((connection) => (
              <ConnectionCard
                key={connection.id}
                connection={connection}
                type="linked"
                onEdit={handleEditContact}
                onRemove={handleRemoveConnection}
                showActions={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* External Contacts Section */}
      {externalContacts.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-medical-dark mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-medical-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            External Contacts ({externalContacts.length})
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {externalContacts.map((contact) => (
              <ConnectionCard
                key={contact.id}
                connection={contact}
                type="external"
                onEdit={handleEditContact}
                onRemove={handleRemoveConnection}
                showActions={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {allConnectionsCount === 0 && !loading && (
        <div className="text-center py-12 text-medical-gray-500">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-medical-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="mb-4">No connections added yet</p>
          <button onClick={() => setShowAddModal(true)} className="btn-medical-primary px-6 py-2">
            Add Your First Connection
          </button>
        </div>
      )}

      {/* Add/Edit Connection Modal */}
      <AddConnectionModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingContact(null);
        }}
        onAddConnection={handleAddConnection}
        onUpdateConnection={handleUpdateContact}
        editingContact={editingContact}
        currentUserId={userId}
        existingConnections={linkedConnections.map((c) => c.connected_user?.id).filter(Boolean)}
      />
    </div>
  );
};

export default Connections;
