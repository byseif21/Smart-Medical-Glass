import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PublicRoute, ProtectedRoute, AdminRoute } from '../../router/routeGuards';
import { useAuth } from '../../hooks/useAuth';

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Helper component for testing routes
const TestComponent = () => <div>Protected Content</div>;
const LoginComponent = () => <div>Login Page</div>;
const DashboardComponent = () => <div>Dashboard</div>;

describe('Route Guards', () => {
  describe('PublicRoute', () => {
    it('renders loading spinner when loading', () => {
      useAuth.mockReturnValue({ isLoading: true, isAuthenticated: false });
      render(
        <MemoryRouter>
          <PublicRoute />
        </MemoryRouter>
      );
    });

    it('redirects to dashboard if authenticated', () => {
      useAuth.mockReturnValue({ isLoading: false, isAuthenticated: true });
      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<PublicRoute />}>
              <Route path="" element={<LoginComponent />} />
            </Route>
            <Route path="/dashboard" element={<DashboardComponent />} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders outlet if not authenticated', () => {
      useAuth.mockReturnValue({ isLoading: false, isAuthenticated: false });
      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<PublicRoute />}>
              <Route path="" element={<LoginComponent />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  describe('ProtectedRoute', () => {
    it('redirects to login if not authenticated', () => {
      useAuth.mockReturnValue({ isLoading: false, isAuthenticated: false });
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/protected" element={<ProtectedRoute />}>
              <Route path="" element={<TestComponent />} />
            </Route>
            <Route path="/login" element={<LoginComponent />} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('renders content if authenticated', () => {
      useAuth.mockReturnValue({ isLoading: false, isAuthenticated: true });
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/protected" element={<ProtectedRoute />}>
              <Route path="" element={<TestComponent />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('AdminRoute', () => {
    it('redirects to dashboard if not admin', () => {
      useAuth.mockReturnValue({
        isLoading: false,
        user: { role: 'user' },
      });
      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/admin" element={<AdminRoute />}>
              <Route path="" element={<TestComponent />} />
            </Route>
            <Route path="/dashboard" element={<DashboardComponent />} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders content if admin', () => {
      useAuth.mockReturnValue({
        isLoading: false,
        user: { role: 'admin' },
      });
      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/admin" element={<AdminRoute />}>
              <Route path="" element={<TestComponent />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
});
