import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { X, Info } from 'lucide-react';
import UserSearchInput from './UserSearchInput';
import ExternalContactForm from './ExternalContactForm';
import RelationshipSelector from './RelationshipSelector';

const AddConnectionModal = ({
  isOpen,
  onClose,
  onAddConnection,
  onUpdateConnection,
  editingContact,
  currentUserId,
  existingConnections = [],
}) => {
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'external'
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRelationship, setSelectedRelationship] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!editingContact;
  const isEditingLinked = !!editingContact?.connected_user;

  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode) {
      if (isEditingLinked) {
        setActiveTab('search');
        setSelectedUser(editingContact.connected_user);
        setSelectedRelationship(editingContact.relationship || '');
      } else {
        setActiveTab('external');
        setSelectedUser(null);
        setSelectedRelationship('');
      }
    } else {
      setActiveTab('search');
      setSelectedUser(null);
      setSelectedRelationship('');
    }
  }, [isOpen, isEditMode, isEditingLinked, editingContact]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  const handleAddLinkedConnection = async () => {
    // Validation
    if (!selectedUser || !selectedRelationship) {
      // TODO: replace alert with GeneralModal
      alert('Please select a user and relationship type');
      return;
    }

    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onAddConnection({
        type: 'linked',
        connected_user_id: selectedUser.id,
        relationship: selectedRelationship,
      });

      // Reset state on success
      setSelectedUser(null);
      setSelectedRelationship('');
    } catch (err) {
      console.error('Error adding linked connection:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateLinkedConnection = async () => {
    if (!selectedRelationship) {
      // TODO: replace with GeneralModal
      alert('Please select a relationship type');
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onUpdateConnection(editingContact.id, { relationship: selectedRelationship }, 'linked');
    } catch (err) {
      console.error('Error updating linked connection:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddExternalContact = async (contactData) => {
    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onAddConnection({
        type: 'external',
        ...contactData,
      });
    } catch (err) {
      console.error('Error adding external contact:', err);
      throw err; // Re-throw to let form handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateExternalContact = async (contactData) => {
    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onUpdateConnection(editingContact.id, contactData, 'external');
    } catch (err) {
      console.error('Error updating external contact:', err);
      throw err; // Re-throw to let form handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedUser(null);
      setSelectedRelationship('');
      setActiveTab('search');
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-medical-lg w-full max-w-2xl overflow-hidden animate-slide-down flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-medical-gray-200">
          <h2 className="text-2xl font-semibold text-medical-dark">
            {isEditMode ? (isEditingLinked ? 'Edit Connection' : 'Edit Contact') : 'Add Connection'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-medical-light rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6 text-medical-gray-600" />
          </button>
        </div>

        {/* Tab Toggle - Hide when editing */}
        {!isEditMode && (
          <div className="flex border-b border-medical-gray-200">
            <button
              onClick={() => setActiveTab('search')}
              disabled={isSubmitting}
              className={`flex-1 py-4 px-6 font-medium transition-colors disabled:opacity-50 ${
                activeTab === 'search'
                  ? 'text-medical-primary border-b-2 border-medical-primary bg-medical-light'
                  : 'text-medical-gray-600 hover:bg-medical-gray-50'
              }`}
            >
              Search Existing User
            </button>
            <button
              onClick={() => setActiveTab('external')}
              disabled={isSubmitting}
              className={`flex-1 py-4 px-6 font-medium transition-colors disabled:opacity-50 ${
                activeTab === 'external'
                  ? 'text-medical-primary border-b-2 border-medical-primary bg-medical-light'
                  : 'text-medical-gray-600 hover:bg-medical-gray-50'
              }`}
            >
              External Contact
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {isEditMode && isEditingLinked ? (
            <div className="space-y-6">
              <div className="p-4 bg-medical-light border border-medical-primary/20 rounded-lg">
                <p className="text-sm text-medical-gray-600 mb-2">Connection:</p>
                <p className="font-semibold text-medical-dark">
                  {editingContact.connected_user?.name}
                </p>
                {editingContact.connected_user?.id && (
                  <p className="text-xs text-medical-gray-500 font-mono">
                    ID: {editingContact.connected_user.id.substring(0, 8).toUpperCase()}
                  </p>
                )}
                {editingContact.connected_user?.email && (
                  <p className="text-sm text-medical-gray-400">
                    {editingContact.connected_user.email}
                  </p>
                )}
              </div>

              <RelationshipSelector
                value={selectedRelationship}
                onChange={setSelectedRelationship}
              />
            </div>
          ) : activeTab === 'search' && !isEditMode ? (
            <div className="space-y-6">
              <UserSearchInput
                onUserSelect={handleUserSelect}
                selectedUser={selectedUser}
                currentUserId={currentUserId}
                existingConnections={existingConnections}
              />

              {selectedUser && (
                <div className="space-y-4">
                  <div className="p-4 bg-medical-light border border-medical-primary/20 rounded-lg">
                    <p className="text-sm text-medical-gray-600 mb-2">Selected User:</p>
                    <p className="font-semibold text-medical-dark">{selectedUser.name}</p>
                    <p className="text-xs text-medical-gray-500 font-mono">
                      ID: {selectedUser.id.substring(0, 8).toUpperCase()}
                    </p>
                    {selectedUser.email && (
                      <p className="text-sm text-medical-gray-400">{selectedUser.email}</p>
                    )}
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-100 rounded text-xs text-yellow-800 flex items-start gap-2">
                      <Info className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>
                        Sending a request will allow this user to see your name and email. Once they
                        accept, you will both be able to see each other&rsquo;s contact information.
                      </span>
                    </div>
                  </div>

                  <RelationshipSelector
                    value={selectedRelationship}
                    onChange={setSelectedRelationship}
                  />
                </div>
              )}
            </div>
          ) : (
            <ExternalContactForm
              onSubmit={isEditMode ? handleUpdateExternalContact : handleAddExternalContact}
              onCancel={handleClose}
              initialData={editingContact}
              isEditMode={isEditMode}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        {/* Footer - Only show for search tab */}
        {isEditMode && isEditingLinked ? (
          <div className="flex justify-end gap-3 p-6 border-t border-medical-gray-200">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="btn-medical-secondary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateLinkedConnection}
              disabled={!selectedRelationship || isSubmitting}
              className="btn-medical-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update Connection'}
            </button>
          </div>
        ) : (
          activeTab === 'search' &&
          !isEditMode && (
            <div className="flex justify-end gap-3 p-6 border-t border-medical-gray-200">
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="btn-medical-secondary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLinkedConnection}
                disabled={!selectedUser || !selectedRelationship || isSubmitting}
                className="btn-medical-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

AddConnectionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAddConnection: PropTypes.func.isRequired,
  onUpdateConnection: PropTypes.func,
  editingContact: PropTypes.object,
  currentUserId: PropTypes.string,
  existingConnections: PropTypes.array,
};

export default AddConnectionModal;
