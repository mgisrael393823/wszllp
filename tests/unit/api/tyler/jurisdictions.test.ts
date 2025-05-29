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
    it('should return Cook County M1-M6 jurisdictions from static config', async () => {
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
      expect(responseData).toHaveProperty('source', 'static_config');
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

      // Verify no fetch calls are made (static data)
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should always return static jurisdictions successfully', async () => {
      // Since we use static data that's part of the build, it should always succeed
      const req = createRequest({
        method: 'GET',
      });

      const res = createResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(200);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData).toHaveProperty('jurisdictions');
      expect(responseData.jurisdictions).toHaveLength(6);
      expect(responseData).toHaveProperty('source', 'static_config');
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

    it('should return static jurisdictions regardless of network state', async () => {
      // Since we now use static data, network state doesn't matter
      const req = createRequest({
        method: 'GET',
      });

      const res = createResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(200);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData).toHaveProperty('jurisdictions');
      expect(responseData).toHaveProperty('source', 'static_config');
      expect(responseData.jurisdictions).toHaveLength(6); // M1-M6 codes
      
      // Verify no network calls were made
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should set proper CORS headers', async () => {
      const req = createRequest({
        method: 'GET',
      });

      const res = createResponse();

      await handler(req, res);

      expect(res.getHeaders()).toMatchObject({
        'access-control-allow-origin': '*',
        'content-type': 'application/json',
      });
      
      // Should return successful response with static data
      expect(res.statusCode).toBe(200);
    });
  });
});