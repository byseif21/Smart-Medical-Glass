import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from '../../context/AuthProvider';
import { AuthContext } from '../../context/AuthContext';
import * as authService from '../../services/auth';
import * as apiService from '../../services/api';
import { useContext } from 'react';

// Mock dependencies
vi.mock('../../services/auth', () => ({
  getCurrentUser: vi.fn(),
  setSession: vi.fn(),
  clearSession: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  getProfile: vi.fn(),
}));

vi.mock('../../services/axios', () => ({
  registerAuthErrorCallback: vi.fn(),
}));

// Test component to access context
const TestComponent = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useContext(AuthContext);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Guest'}</div>
      {user && <div data-testid="user-name">{user.name}</div>}
      <button onClick={() => login({ user_id: '123', name: 'Test User', role: 'user' })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with no user when storage is empty', async () => {
    authService.getCurrentUser.mockReturnValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Guest');
  });

  it('initializes with user when storage has data', async () => {
    const mockUser = { id: '123', name: 'Existing User' };
    authService.getCurrentUser.mockReturnValue(mockUser);
    apiService.getProfile.mockResolvedValue({ success: false }); // Fail profile fetch for simplicity

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user-name')).toHaveTextContent('Existing User');
  });

  it('handles login successfully', async () => {
    authService.getCurrentUser.mockReturnValue(null);
    apiService.getProfile.mockResolvedValue({ success: false });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const loginBtn = screen.getByText('Login');
    await act(async () => {
      loginBtn.click();
    });

    expect(authService.setSession).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: '123',
        name: 'Test User',
      })
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
  });

  it('handles logout successfully', async () => {
    const mockUser = { id: '123', name: 'User to Logout' };
    authService.getCurrentUser.mockReturnValue(mockUser);
    apiService.getProfile.mockResolvedValue({ success: false });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const logoutBtn = screen.getByText('Logout');
    await act(async () => {
      logoutBtn.click();
    });

    expect(authService.clearSession).toHaveBeenCalled();
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Guest');
  });
});
