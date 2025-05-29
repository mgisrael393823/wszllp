import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequest, createResponse } from 'node-mocks-http';

// Create mock function first
const mockSupabaseRpc = vi.fn();

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    rpc: mockSupabaseRpc,
  })),
}));

// Import handler after mocking
const handler = await import('../../../api/cases.js').then(m => m.default);

describe('/api/cases endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/cases', () => {
    it('should create a case record with valid payload', async () => {
      // Mock successful database response
      mockSupabaseRpc.mockResolvedValue({
        data: 'case-uuid-123',
        error: null,
      });

      const req = createRequest({
        method: 'POST',
        body: {
          userId: 'user-uuid-123',
          jurisdiction: 'il',
          county: 'cook',
          caseType: 'eviction',
          attorneyId: 'ATT123',
          referenceId: 'WSZ-1234567890',
        },
      });

      const res = createResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(201);
      expect(JSON.parse(res._getData())).toEqual({
        success: true,
        caseId: 'case-uuid-123',
        message: 'Case created successfully',
      });

      expect(mockSupabaseRpc).toHaveBeenCalledWith('create_case_with_transaction', {
        p_user_id: 'user-uuid-123',
        p_jurisdiction: 'il',
        p_county: 'cook',
        p_case_type: 'eviction',
        p_attorney_id: 'ATT123',
        p_reference_id: 'WSZ-1234567890',
        p_status: 'Open',
        p_case_category: '7',
        p_payment_account_id: null,
        p_amount_in_controversy: null,
        p_show_amount_in_controversy: false,
        p_petitioner: null,
        p_defendants: '[]',
      });
    });

    it('should return 400 for missing required fields', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          // Missing all required fields
        },
      });

      const res = createResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Missing required fields',
        required: ['userId', 'jurisdiction', 'county', 'caseType', 'attorneyId', 'referenceId'],
      });

      expect(mockSupabaseRpc).not.toHaveBeenCalled();
    });

    it('should return 500 for database error', async () => {
      // Mock database error
      mockSupabaseRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const req = createRequest({
        method: 'POST',
        body: {
          userId: 'user-uuid-123',
          jurisdiction: 'il',
          county: 'cook',
          caseType: 'eviction',
          attorneyId: 'ATT123',
          referenceId: 'WSZ-1234567890',
        },
      });

      const res = createResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Failed to create case',
        details: 'Database connection failed',
      });
    });

    it('should return 405 for non-POST methods', async () => {
      const req = createRequest({
        method: 'GET',
      });

      const res = createResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(405);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Method not allowed',
      });
    });

    it('should handle OPTIONS request for CORS', async () => {
      const req = createRequest({
        method: 'OPTIONS',
      });

      const res = createResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._getHeaders()).toMatchObject({
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'Content-Type, Authorization',
      });
    });

    it('should handle unexpected errors gracefully', async () => {
      // Mock unexpected error
      mockSupabaseRpc.mockRejectedValue(new Error('Unexpected error'));

      const req = createRequest({
        method: 'POST',
        body: {
          userId: 'user-uuid-123',
          jurisdiction: 'il',
          county: 'cook',
          caseType: 'eviction',
          attorneyId: 'ATT123',
          referenceId: 'WSZ-1234567890',
        },
      });

      const res = createResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Internal server error',
        message: 'Unexpected error',
      });
    });
  });
});