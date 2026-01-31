import { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/auth';
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
import {
  UserPlus,
  CheckCircle,
  AlertCircle,
  Clock,
  Link as LinkIcon,
  Globe,
  Users,
} from 'lucide-react';

const Connections = ({ targetUserId }) => {
  const [loading, setLoading] = useState(false);
  const [linkedConnections, setLinkedConnections] = useState([]);
  const [externalContacts, setExternalContacts] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const userId = targetUserId || getCurrentUser()?.id;

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
        // TODO: integrate with global notification box instead of local successMessage
        // setSuccessMessage('Connection request accepted!');
        await fetchConnections();
        await fetchPendingRequests();
        // setTimeout(() => setSuccessMessage(null), 3000);
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
        // TODO: integrate with global notification box instead of local successMessage
        // setSuccessMessage('Connection request rejected');
        await fetchPendingRequests();
        // setTimeout(() => setSuccessMessage(null), 3000);
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
        if (result.status === 404) {
          setSuccessMessage('This connection no longer exists. It may have been removed.');
          setEditingContact(null);
          setShowAddModal(false);
          await fetchConnections();
          setTimeout(() => setSuccessMessage(null), 4000);
        } else {
          setError(result.error || 'Failed to update connection. Please try again.');
          throw new Error(result.error);
        }
      }
    } catch (err) {
      console.error('Error updating connection:', err);
      if (!error) {
        setError('An unexpected error occurred. Please check your connection and try again.');
      }
    }
  };

  // TODO: unify in GeneralModal (consistent UX)
  const handleRemoveConnection = (connection) => {
    setConfirmTarget(connection);
    setConfirmOpen(true);
  };

  const confirmRemoveConnection = async () => {
    if (!confirmTarget || confirmBusy) return;
    setConfirmBusy(true);
    setError(null);

    try {
      const result = await deleteConnection(confirmTarget.id);

      if (result.success) {
        setSuccessMessage(
          'Connection removed successfully! Any pending requests have also been cleared.'
        );
        await fetchConnections();
        setConfirmOpen(false);
        setConfirmTarget(null);
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
    } finally {
      setConfirmBusy(false);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-semibold">Family Connections</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-medical-primary text-sm px-4 py-2 flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <UserPlus className="w-5 h-5" />
          Add Connection
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <div className="mb-8 p-4 bg-medical-light/30 border border-medical-primary/20 rounded-xl">
          <h3 className="text-lg font-semibold text-medical-dark mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-medical-primary" />
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
                <div className="flex gap-2 flex-shrink-0">
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
            <LinkIcon className="w-5 h-5 text-medical-primary" />
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
            <Globe className="w-5 h-5 text-medical-gray-600" />
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
          <Users className="w-16 h-16 mx-auto mb-4 text-medical-gray-300" />
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
      {confirmOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !confirmBusy) {
              setConfirmOpen(false);
              setConfirmTarget(null);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-medical-lg w-full max-w-md overflow-hidden animate-slide-down">
            <div className="p-6 border-b border-medical-gray-200">
              <h3 className="text-xl font-semibold text-medical-dark">Remove Connection</h3>
              <p className="text-sm text-medical-gray-600 mt-2">
                Are you sure you want to remove{' '}
                <span className="font-medium text-medical-dark">
                  {confirmTarget?.name || confirmTarget?.connected_user?.name}
                </span>
                ? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-3 p-4">
              <button
                onClick={() => {
                  if (!confirmBusy) {
                    setConfirmOpen(false);
                    setConfirmTarget(null);
                  }
                }}
                disabled={confirmBusy}
                className="btn-medical-secondary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveConnection}
                disabled={confirmBusy}
                className="btn-medical-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {confirmBusy ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Connections;
