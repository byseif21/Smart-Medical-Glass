import { useState, useEffect, useCallback, useMemo } from 'react';
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

const handleFetchResult = (result, { setLinkedConnections, setExternalContacts, setError }) => {
  if (result.success) {
    setLinkedConnections(result.data.linked_connections || []);
    setExternalContacts(result.data.external_contacts || []);
  } else {
    setError(result.error || 'Failed to load connections. Please try again.');
  }
};

const handleOperationResult = async (
  result,
  { setError, setSuccessMessage, refreshers },
  options
) => {
  if (!result.success) {
    if (result.status === 404) {
      setSuccessMessage('This connection no longer exists. It may have been removed.');
      if (options.refreshConnections) await refreshers.fetchConnections();
      return false;
    }
    setError(result.error || 'Operation failed');
    return false;
  }

  if (options.successMsg) setSuccessMessage(options.successMsg);
  if (options.refreshConnections) await refreshers.fetchConnections();
  if (options.refreshPending) await refreshers.fetchPendingRequests();
  return true;
};

const executeAction = async (context, actionFn, successMsg, refreshOptions = {}) => {
  const { setError, setSuccessMessage, fetchConnections, fetchPendingRequests } = context;
  setError(null);
  try {
    const result = await actionFn();
    return await handleOperationResult(
      result,
      { setError, setSuccessMessage, refreshers: { fetchConnections, fetchPendingRequests } },
      { successMsg, ...refreshOptions }
    );
  } catch (err) {
    console.error('Operation error:', err);
    setError('An unexpected error occurred. Please check your connection and try again.');
    return false;
  }
};

const createConnectionApiCall = (data) => {
  if (data.type === 'linked') {
    return createLinkedConnection({
      connected_user_id: data.connected_user_id,
      relationship: data.relationship,
    });
  }
  return createExternalContact({
    name: data.name,
    phone: data.phone,
    address: data.address,
    relationship: data.relationship,
  });
};

// Factory for creating action handlers
const createConnectionActions = (context) => {
  return {
    addConnection: (data) =>
      executeAction(
        context,
        () => createConnectionApiCall(data),
        data.type === 'linked'
          ? 'Connection request sent successfully! Waiting for approval.'
          : 'Contact added successfully!',
        { refreshConnections: true }
      ),

    updateContact: (contactId, data, type) =>
      executeAction(
        context,
        () => updateConnection(contactId, data, type),
        'Connection updated successfully!',
        { refreshConnections: true }
      ),

    removeConnection: (id) =>
      executeAction(
        context,
        () => deleteConnection(id),
        'Connection removed successfully! Any pending requests have also been cleared.',
        { refreshConnections: true }
      ),

    acceptRequest: (requestId) =>
      executeAction(
        context,
        () => acceptConnectionRequest(requestId),
        'Connection request accepted successfully!',
        { refreshConnections: true, refreshPending: true }
      ),

    rejectRequest: (requestId) =>
      executeAction(
        context,
        () => rejectConnectionRequest(requestId),
        'Connection request rejected.',
        { refreshPending: true }
      ),

    clearSuccessMessage: () => context.setSuccessMessage(null),
    clearError: () => context.setError(null),
  };
};

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
      handleFetchResult(result, { setLinkedConnections, setExternalContacts, setError });
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

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    fetchConnections();
    fetchPendingRequests();
  }, [fetchConnections, fetchPendingRequests]);

  const actions = useMemo(
    () =>
      createConnectionActions({
        setError,
        setSuccessMessage,
        fetchConnections,
        fetchPendingRequests,
      }),
    [setError, setSuccessMessage, fetchConnections, fetchPendingRequests]
  );

  return {
    loading,
    linkedConnections,
    externalContacts,
    pendingRequests,
    error,
    successMessage,
    userId,
    fetchConnections,
    ...actions,
    allConnectionsCount: linkedConnections.length + externalContacts.length,
  };
};
