import { useState } from 'react';
import PropTypes from 'prop-types';
import { useConnections } from '../hooks/useConnections';
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

const PendingRequestsList = ({ requests, onAccept, onReject }) => {
  if (requests.length === 0) return null;

  return (
    <div className="mb-8 p-4 bg-medical-light/30 border border-medical-primary/20 rounded-xl">
      <h3 className="text-lg font-semibold text-medical-dark mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-medical-primary" />
        Pending Connection Requests ({requests.length})
      </h3>
      <div className="space-y-3">
        {requests.map((request) => (
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
                onClick={() => onAccept(request.id)}
                className="px-3 py-1.5 bg-medical-primary text-white text-sm font-medium rounded-md hover:bg-medical-primary-dark transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => onReject(request.id)}
                className="px-3 py-1.5 bg-medical-gray-100 text-medical-gray-700 text-sm font-medium rounded-md hover:bg-medical-gray-200 transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

PendingRequestsList.propTypes = {
  requests: PropTypes.array.isRequired,
  onAccept: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
};

const ConnectionsSection = ({ title, icon: Icon, connections, type, onEdit, onRemove }) => {
  if (connections.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-medical-dark mb-4 flex items-center gap-2">
        <Icon
          className={`w-5 h-5 ${type === 'linked' ? 'text-medical-primary' : 'text-medical-gray-600'}`}
        />
        {title} ({connections.length})
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        {connections.map((connection) => (
          <ConnectionCard
            key={connection.id}
            connection={connection}
            type={type}
            onEdit={onEdit}
            onRemove={onRemove}
            showActions={true}
          />
        ))}
      </div>
    </div>
  );
};

ConnectionsSection.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  connections: PropTypes.array.isRequired,
  type: PropTypes.string.isRequired,
  onEdit: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

const EmptyState = ({ onAdd }) => (
  <div className="text-center py-12 text-medical-gray-500">
    <Users className="w-16 h-16 mx-auto mb-4 text-medical-gray-300" />
    <p className="mb-4">No connections added yet</p>
    <button onClick={onAdd} className="btn-medical-primary px-6 py-2">
      Add Your First Connection
    </button>
  </div>
);

EmptyState.propTypes = {
  onAdd: PropTypes.func.isRequired,
};

const RemoveConfirmationModal = ({ isOpen, target, isBusy, onConfirm, onCancel }) => {
  if (!isOpen || !target) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isBusy) {
          onCancel();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-medical-lg w-full max-w-md overflow-hidden animate-slide-down">
        <div className="p-6 border-b border-medical-gray-200">
          <h3 className="text-xl font-semibold text-medical-dark">Remove Connection</h3>
          <p className="text-sm text-medical-gray-600 mt-2">
            Are you sure you want to remove{' '}
            <span className="font-medium text-medical-dark">
              {target.name || target.connected_user?.name}
            </span>
            ? This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-3 p-4">
          <button
            onClick={onCancel}
            disabled={isBusy}
            className="btn-medical-secondary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isBusy}
            className="btn-medical-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBusy ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
};

RemoveConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  target: PropTypes.object,
  isBusy: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

const Connections = ({ targetUserId }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const {
    loading,
    linkedConnections,
    externalContacts,
    pendingRequests,
    error,
    successMessage,
    userId,
    acceptRequest,
    rejectRequest,
    addConnection,
    updateContact,
    removeConnection,
    allConnectionsCount,
  } = useConnections(targetUserId);

  const handleAddSubmit = async (data) => {
    const success = await addConnection(data);
    if (success) {
      setShowAddModal(false);
      setEditingContact(null);
    }
  };

  const handleUpdateSubmit = async (contactId, updatedData, connectionType) => {
    const success = await updateContact(contactId, updatedData, connectionType);
    if (success) {
      setShowAddModal(false);
      setEditingContact(null);
    }
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setShowAddModal(true);
  };

  const handleRemoveClick = (connection) => {
    setConfirmTarget(connection);
    setConfirmOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (!confirmTarget || confirmBusy) return;
    setConfirmBusy(true);
    const success = await removeConnection(confirmTarget.id);
    setConfirmBusy(false);
    if (success) {
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  };

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

      <PendingRequestsList
        requests={pendingRequests}
        onAccept={acceptRequest}
        onReject={rejectRequest}
      />

      <ConnectionsSection
        title="Linked Connections"
        icon={LinkIcon}
        connections={linkedConnections}
        type="linked"
        onEdit={handleEditContact}
        onRemove={handleRemoveClick}
      />

      <ConnectionsSection
        title="External Contacts"
        icon={Globe}
        connections={externalContacts}
        type="external"
        onEdit={handleEditContact}
        onRemove={handleRemoveClick}
      />

      {allConnectionsCount === 0 && !loading && <EmptyState onAdd={() => setShowAddModal(true)} />}

      <AddConnectionModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingContact(null);
        }}
        onAddConnection={handleAddSubmit}
        onUpdateConnection={handleUpdateSubmit}
        editingContact={editingContact}
        currentUserId={userId}
        existingConnections={linkedConnections.map((c) => c.connected_user?.id).filter(Boolean)}
      />

      <RemoveConfirmationModal
        isOpen={confirmOpen}
        target={confirmTarget}
        isBusy={confirmBusy}
        onConfirm={handleConfirmRemove}
        onCancel={() => {
          if (!confirmBusy) {
            setConfirmOpen(false);
            setConfirmTarget(null);
          }
        }}
      />
    </div>
  );
};

export default Connections;
