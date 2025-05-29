import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequest, createResponse } from 'node-mocks-http';
import handler from '../../../../api/tyler/jurisdictions.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('/api/tyler/jurisdictions endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variables
    process.env.VITE_EFILE_BASE_URL = 'https://api.uslegalpro.com/v4';
    process.env.VITE_EFILE_CLIENT_TOKEN = 'TEST_CLIENT_TOKEN';
    process.env.TYLER_API_USERNAME = 'test@example.com';
    process.env.TYLER_API_PASSWORD = 'testpassword';
  });

  describe('GET /api/tyler/jurisdictions', () => {
    it('should return Cook County M1-M6 jurisdictions from Tyler API', async () => {
      // Mock Tyler auth response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          item: { auth_token: 'mock-auth-token' }
        })
      });

      // Mock Tyler jurisdictions response with M1-M6 codes
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          items: [
            { code: 'cook:M1', label: 'Municipal Civil – District 1 (Chicago)', state: 'il' },
            { code: 'cook:M2', label: 'Municipal Civil – District 2 (Skokie)', state: 'il' },
            { code: 'cook:M3', label: 'Municipal Civil – District 3 (Rolling Meadows)', state: 'il' },
            { code: 'cook:M4', label: 'Municipal Civil – District 4 (Maywood)', state: 'il' },
            { code: 'cook:M5', label: 'Municipal Civil – District 5 (Bridgeview)', state: 'il' },
            { code: 'cook:M6', label: 'Municipal Civil – District 6 (Markham)', state: 'il' },
            { code: 'dupage:C1', label: 'DuPage County Civil', state: 'il' }, // Should be filtered out in our hardcoded list
          ]
        })
      });

      const req = createRequest({
        method: 'GET',
      });

      const res = createResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(200);
      const responseData = JSON.parse(res._getData());
      
      // Verify the response structure
      expect(responseData).toHaveProperty('jurisdictions');
      expect(responseData).toHaveProperty('cached_at');
      expect(Array.isArray(responseData.jurisdictions)).toBe(true);

      // Verify Cook County M1-M6 codes are present
      const cookJurisdictions = responseData.jurisdictions.filter((j: any) => j.code?.startsWith('cook:M'));
      expect(cookJurisdictions).toHaveLength(6);
      
      const expectedCodes = ['cook:M1', 'cook:M2', 'cook:M3', 'cook:M4', 'cook:M5', 'cook:M6'];
      expectedCodes.forEach(code => {
        const jurisdiction = responseData.jurisdictions.find((j: any) => j.code === code);
        expect(jurisdiction).toBeDefined();
        expect(jurisdiction.state).toBe('il');
      });

      // Verify fetch calls
      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      // First call: authentication
      expect(mockFetch).toHaveBeenNthCalledWith(1, 
        'https://api.uslegalpro.com/v4/il/user/authenticate',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'clienttoken': 'TEST_CLIENT_TOKEN'
          })
        })
      );

      // Second call: jurisdictions
      expect(mockFetch).toHaveBeenNthCalledWith(2,
        'https://api.uslegalpro.com/v4/il/jurisdictions',
        expect.objectContaining({
          headers: expect.objectContaining({
            authtoken: 'mock-auth-token',
            clienttoken: 'TEST_CLIENT_TOKEN'
          })
        })
      );
    });

    it('should return fallback jurisdictions when Tyler API fails', async () => {
      // Mock Tyler auth failure
      mockFetch.mockRejectedValue(new Error('Tyler API unavailable'));

      const req = createRequest({
        method: 'GET',
      });

      const res = createResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(500);
      const responseData = JSON.parse(res._getData());
      
      // Should return fallback jurisdictions from our config
      expect(responseData).toHaveProperty('error', 'Failed to fetch jurisdictions');
      expect(responseData).toHaveProperty('jurisdictions');
      expect(responseData).toHaveProperty('fallback', true);
      
      // Verify fallback contains our M1-M6 codes
      const cookJurisdictions = responseData.jurisdictions.filter((j: any) => j.code?.startsWith('cook:M'));
      expect(cookJurisdictions).toHaveLength(6);
      
      const expectedCodes = ['cook:M1', 'cook:M2', 'cook:M3', 'cook:M4', 'cook:M5', 'cook:M6'];
      expectedCodes.forEach(code => {
        const jurisdiction = responseData.jurisdictions.find((j: any) => j.code === code);
        expect(jurisdiction).toBeDefined();
        expect(jurisdiction.state).toBe('il');
      });
    });

    it('should return 405 for non-GET methods', async () => {
      const req = createRequest({
        method: 'POST',
      });

      const res = createResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(405);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Method not allowed'
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle Tyler auth failure gracefully', async () => {
      // Mock Tyler auth failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const req = createRequest({
        method: 'GET',
      });

      const res = createResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(500);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData).toHaveProperty('error', 'Failed to fetch jurisdictions');
      expect(responseData).toHaveProperty('fallback', true);
      expect(responseData.jurisdictions).toHaveLength(6); // Fallback M1-M6 codes
    });

    it('should set proper CORS headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ item: { auth_token: 'token' } })
      });
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [] })
      });

      const req = createRequest({
        method: 'GET',
      });

      const res = createResponse();

      await handler(req, res);

      expect(res.getHeaders()).toMatchObject({
        'access-control-allow-origin': '*',
        'content-type': 'application/json',
      });
    });
  });
});