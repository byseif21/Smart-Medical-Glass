import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useConnections } from '../../hooks/useConnections';
import { AuthContext } from '../../context/AuthContext';
import * as apiService from '../../services/api';

// Mock API service
vi.mock('../../services/api', () => ({
  getConnections: vi.fn(),
  getPendingRequests: vi.fn(),
  createLinkedConnection: vi.fn(),
  createExternalContact: vi.fn(),
  updateConnection: vi.fn(),
  deleteConnection: vi.fn(),
}));

// Mock wrapper to provide AuthContext
const wrapper = ({ children }) => (
  <AuthContext.Provider value={{ user: { id: '123' }, isAuthenticated: true }}>
    {children}
  </AuthContext.Provider>
);

describe('useConnections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches connections on mount', async () => {
    const mockConnections = {
      linked_connections: [{ id: 1, name: 'Rel 1' }],
      external_contacts: [{ id: 2, name: 'Contact 1' }],
    };

    apiService.getConnections.mockResolvedValue({ success: true, data: mockConnections });
    apiService.getPendingRequests.mockResolvedValue({ success: true, data: [] });

    const { result } = renderHook(() => useConnections(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.linkedConnections).toHaveLength(1);
    expect(result.current.externalContacts).toHaveLength(1);
    expect(apiService.getConnections).toHaveBeenCalled();
  });

  it('handles fetch error gracefully', async () => {
    apiService.getConnections.mockResolvedValue({ success: false, error: 'Network error' });
    apiService.getPendingRequests.mockResolvedValue({ success: true, data: [] });

    const { result } = renderHook(() => useConnections(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.linkedConnections).toEqual([]);
  });

  it('adds external contact successfully', async () => {
    // Setup initial fetch
    apiService.getConnections.mockResolvedValue({
      success: true,
      data: { linked_connections: [], external_contacts: [] },
    });
    apiService.getPendingRequests.mockResolvedValue({ success: true, data: [] });

    // Setup create response
    apiService.createExternalContact.mockResolvedValue({ success: true, data: { id: 1 } });

    const { result } = renderHook(() => useConnections(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addConnection({
        type: 'external',
        name: 'New Contact',
        phone: '1234567890',
        relationship: 'Friend',
      });
    });

    expect(apiService.createExternalContact).toHaveBeenCalledWith({
      name: 'New Contact',
      phone: '1234567890',
      address: undefined,
      relationship: 'Friend',
    });

    expect(result.current.successMessage).toBeTruthy();
    // It should trigger a refresh
    expect(apiService.getConnections).toHaveBeenCalledTimes(2);
  });
});
