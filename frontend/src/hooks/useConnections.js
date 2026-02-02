import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
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

export const useConnections = (targetUserId) => {
  const [loading, setLoading] = useState(false);
  const [linkedConnections, setLinkedConnections] = useState([]);
  const [externalContacts, setExternalContacts] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const { user } = useAuth();
  const userId = targetUserId || user?.id;

  const fetchConnections = useCallback(async () => {
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
  }, [userId]);

  const fetchPendingRequests = useCallback(async () => {
    try {
      const result = await getPendingRequests();
      if (result.success) {
        setPendingRequests(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching pending requests:', err);
    }
  }, []);

  // Fetch connections on mount
  useEffect(() => {
    fetchConnections();
    fetchPendingRequests();
  }, [fetchConnections, fetchPendingRequests]);

  const processConnectionRequest = async (
    requestId,
    apiFunc,
    errorMsg,
    refreshConnections = false
  ) => {
    try {
      const result = await apiFunc(requestId);
      if (result.success) {
        if (refreshConnections) {
          await fetchConnections();
        }
        await fetchPendingRequests();
      } else {
        setError(result.error || errorMsg);
      }
    } catch (err) {
      console.error(errorMsg, err);
      setError(errorMsg);
    }
  };

  const handleAcceptRequest = (requestId) =>
    processConnectionRequest(requestId, acceptConnectionRequest, 'Failed to accept request', true);

  const handleRejectRequest = (requestId) =>
    processConnectionRequest(requestId, rejectConnectionRequest, 'Failed to reject request');

  const addConnection = async (connectionData) => {
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
        await fetchConnections();

        // Return success so UI can close modal
        return true;
      } else {
        setError(result.error || 'Failed to add connection. Please try again.');
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error adding connection:', err);
      if (!error) {
        setError('An unexpected error occurred. Please check your connection and try again.');
      }
      return false;
    }
  };

  const updateContact = async (contactId, updatedData, connectionType) => {
    setError(null);

    try {
      const result = await updateConnection(contactId, updatedData, connectionType);

      if (result.success) {
        setSuccessMessage('Connection updated successfully!');
        await fetchConnections();
        return true;
      } else {
        if (result.status === 404) {
          setSuccessMessage('This connection no longer exists. It may have been removed.');
          await fetchConnections();
        } else {
          setError(result.error || 'Failed to update connection. Please try again.');
          throw new Error(result.error);
        }
        return false;
      }
    } catch (err) {
      console.error('Error updating connection:', err);
      if (!error) {
        setError('An unexpected error occurred. Please check your connection and try again.');
      }
      return false;
    }
  };

  const removeConnection = async (connectionId) => {
    setError(null);

    try {
      const result = await deleteConnection(connectionId);

      if (result.success) {
        setSuccessMessage(
          'Connection removed successfully! Any pending requests have also been cleared.'
        );
        await fetchConnections();
        return true;
      } else {
        setError(result.error || 'Failed to remove connection. Please try again.');
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error removing connection:', err);
      if (!error) {
        setError('An unexpected error occurred. Please check your connection and try again.');
      }
      return false;
    }
  };

  const clearSuccessMessage = () => setSuccessMessage(null);
  const clearError = () => setError(null);

  return {
    loading,
    linkedConnections,
    externalContacts,
    pendingRequests,
    error,
    successMessage,
    userId,
    fetchConnections,
    handleAcceptRequest,
    handleRejectRequest,
    addConnection,
    updateContact,
    removeConnection,
    clearSuccessMessage,
    clearError,
    allConnectionsCount: linkedConnections.length + externalContacts.length,
  };
};
