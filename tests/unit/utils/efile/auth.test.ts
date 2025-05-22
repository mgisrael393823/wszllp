process.env.VITE_EFILE_CLIENT_TOKEN = 'EVICT87';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/utils/efile/apiClient', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

import { apiClient } from '@/utils/efile/apiClient';
const { authenticate, storeToken, getStoredToken, isTokenExpired } = await import('@/utils/efile/auth');

describe('Authentication utilities', () => {
  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();
    
    // Mock localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value.toString(); },
        clear: () => { store = {}; }
      };
    })();
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
  });
  
  afterEach(() => {
    // Clear localStorage after each test
    window.localStorage.clear();
    
    // Restore environment variables
    vi.unstubAllEnvs();
  });
  
  describe('authenticate', () => {
    it('should call API with correct parameters and return token', async () => {
      // Mock successful API response
      const mockResponse = {
        data: {
          item: {
            auth_token: 'test-auth-token',
          },
        },
      };
      
      // Setup the mock to return our response
      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
      
      // Call the function
      const result = await authenticate('test-username', 'test-password');
      
      // Check API was called correctly
      expect(apiClient.post).toHaveBeenCalledWith(
        '/il/user/authenticate',
        { data: { username: 'test-username', password: 'test-password' } },
        { headers: { clienttoken: 'EVICT87' } }
      );
      
      // Check result
      expect(result).toBe('test-auth-token');
    });
    
    it('should throw error if API call fails', async () => {
      // Mock API error
      const mockError = new Error('API error');
      (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValue(mockError);
      
      // Check that the function throws
      await expect(authenticate('test-username', 'test-password'))
        .rejects.toThrow('API error');
    });
  });
  
  describe('storeToken', () => {
    it('should store token and expiry in localStorage', () => {
      // Mock Date.now to return a fixed timestamp
      const now = 1632825600000; // 2021-09-28T12:00:00.000Z
      const realDateNow = Date.now;
      Date.now = vi.fn(() => now);
      
      // Call the function
      storeToken('test-token', 3600);
      
      // Check localStorage
      const stored = JSON.parse(window.localStorage.getItem('efileAuth') || '{}');
      expect(stored).toEqual({
        token: 'test-token',
        expires: now + 3600 * 1000,
      });
      
      // Restore Date.now
      Date.now = realDateNow;
    });
  });
  
  describe('getStoredToken', () => {
    it('should return token from localStorage', () => {
      // Setup localStorage
      window.localStorage.setItem(
        'efileAuth',
        JSON.stringify({ token: 'test-token', expires: 1632825600000 })
      );
      
      // Call the function
      const result = getStoredToken();
      
      // Check result
      expect(result).toEqual({
        token: 'test-token',
        expires: 1632825600000,
      });
    });
    
    it('should return null if no token in localStorage', () => {
      // Call the function
      const result = getStoredToken();
      
      // Check result
      expect(result).toBeNull();
    });
  });
  
  describe('isTokenExpired', () => {
    it('should return true if token is expired', () => {
      // Mock Date.now to return a fixed timestamp
      const now = 1632825600000; // 2021-09-28T12:00:00.000Z
      const realDateNow = Date.now;
      Date.now = vi.fn(() => now);
      
      // Call the function
      const result = isTokenExpired(now - 1000);
      
      // Check result
      expect(result).toBe(true);
      
      // Restore Date.now
      Date.now = realDateNow;
    });
    
    it('should return false if token is not expired', () => {
      // Mock Date.now to return a fixed timestamp
      const now = 1632825600000; // 2021-09-28T12:00:00.000Z
      const realDateNow = Date.now;
      Date.now = vi.fn(() => now);
      
      // Call the function
      const result = isTokenExpired(now + 1000);
      
      // Check result
      expect(result).toBe(false);
      
      // Restore Date.now
      Date.now = realDateNow;
    });
  });
});