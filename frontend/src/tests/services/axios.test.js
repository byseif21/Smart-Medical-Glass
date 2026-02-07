import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAccessToken, getCurrentUser, clearSession } from '../../services/auth';

// Mock auth service BEFORE importing axios setup
vi.mock('../../services/auth', () => ({
  getAccessToken: vi.fn(),
  getCurrentUser: vi.fn(),
  clearSession: vi.fn(),
}));

// Mock window.location
const mockAssign = vi.fn();
const mockReplace = vi.fn();
Object.defineProperty(window, 'location', {
  value: {
    assign: mockAssign,
    replace: mockReplace,
    origin: 'http://localhost:3000',
  },
  writable: true,
});

const mocks = vi.hoisted(() => ({
  requestHandler: null,
  responseHandler: null,
  responseErrorHandler: null,
  requestUse: vi.fn((success) => {
    mocks.requestHandler = success;
  }),
  responseUse: vi.fn((success, error) => {
    mocks.responseHandler = success;
    mocks.responseErrorHandler = error;
  }),
}));

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: mocks.requestUse },
        response: { use: mocks.responseUse },
      },
      defaults: { headers: { common: {} } },
    })),
  },
}));

// Import the module under test
import apiClient, { registerAuthErrorCallback } from '../../services/axios';

// Prevent unused variable warnings for imports that have side effects (axios.create)
// We just need the import to run, but we also use registerAuthErrorCallback
void apiClient;

describe('Axios Service', () => {
  beforeEach(() => {
    // Only clear specific mocks
    getAccessToken.mockReset();
    getCurrentUser.mockReset();
    clearSession.mockReset();
    window.location.assign.mockReset();
    window.location.replace.mockReset();
  });

  describe('Request Interceptor', () => {
    it('adds Authorization header if token exists', async () => {
      // Setup mock auth data
      getAccessToken.mockReturnValue('fake-token');
      getCurrentUser.mockReturnValue(null);

      const config = { headers: {} };
      const result = mocks.requestHandler(config);

      expect(result.headers.Authorization).toBe('Bearer fake-token');
    });

    it('adds X-User-ID header if user exists', () => {
      getAccessToken.mockReturnValue(null);
      getCurrentUser.mockReturnValue({ id: 'user-123' });

      const config = { headers: {} };
      const result = mocks.requestHandler(config);

      expect(result.headers['X-User-ID']).toBe('user-123');
    });

    it('does not add headers if data is missing', () => {
      getAccessToken.mockReturnValue(null);
      getCurrentUser.mockReturnValue(null);

      const config = { headers: {} };
      const result = mocks.requestHandler(config);

      expect(result.headers.Authorization).toBeUndefined();
      expect(result.headers['X-User-ID']).toBeUndefined();
    });
  });

  describe('Response Interceptor', () => {
    it('passes through successful responses', () => {
      const response = { data: 'success' };
      expect(mocks.responseHandler(response)).toBe(response);
    });

    it('handles 401 errors by redirecting to login', async () => {
      const error = {
        response: { status: 401 },
        config: {},
      };

      try {
        await mocks.responseErrorHandler(error);
      } catch (e) {
        expect(e).toBe(error);
      }

      expect(clearSession).toHaveBeenCalled();
      expect(window.location.replace).toHaveBeenCalledWith('/login');
    });

    it('uses custom auth error callback if registered', async () => {
      const mockCallback = vi.fn();

      registerAuthErrorCallback(mockCallback);

      const error = {
        response: { status: 401 },
        config: {},
      };

      try {
        await mocks.responseErrorHandler(error);
      } catch {
        // Expected to reject
      }

      expect(mockCallback).toHaveBeenCalled();
      expect(clearSession).not.toHaveBeenCalled();
    });

    it('ignores 401 if skipAuthRedirect is true', async () => {
      const mockCallback = vi.fn();
      registerAuthErrorCallback(mockCallback);

      const error = {
        response: { status: 401 },
        config: { skipAuthRedirect: true },
      };

      try {
        await mocks.responseErrorHandler(error);
      } catch {
        // Expected
      }

      expect(mockCallback).not.toHaveBeenCalled();
      expect(window.location.replace).not.toHaveBeenCalled();
    });
  });
});
