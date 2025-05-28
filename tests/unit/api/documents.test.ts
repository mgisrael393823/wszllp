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
const handler = await import('../../../api/documents.js').then(m => m.default);

describe('/api/documents endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/documents', () => {
    const validPayload = {
      caseId: '123e4567-e89b-12d3-a456-426614174000',
      envelopeId: 'ENV123',
      filingId: 'FIL123',
      fileName: 'complaint.pdf',
      docType: 'document',
      status: 'submitted',
      timestamp: '2025-05-28T12:00:00.000Z',
    };

    it('should create a document record with valid payload', async () => {
      // Mock successful database response
      mockSupabaseRpc.mockResolvedValue({
        data: 'document-uuid-456',
        error: null,
      });

      const req = createRequest({
        method: 'POST',
        body: validPayload,
      });

      const res = createResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(201);
      expect(JSON.parse(res._getData())).toEqual({
        success: true,
        documentId: 'document-uuid-456',
        message: 'Document created successfully',
      });

      expect(mockSupabaseRpc).toHaveBeenCalledWith('create_document_with_validation', {
        p_case_id: '123e4567-e89b-12d3-a456-426614174000',
        p_envelope_id: 'ENV123',
        p_filing_id: 'FIL123',
        p_file_name: 'complaint.pdf',
        p_doc_type: 'document',
        p_efile_status: 'submitted',
        p_efile_timestamp: '2025-05-28T12:00:00.000Z',
      });
    });

    it('should return 400 for missing required fields', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          caseId: '123e4567-e89b-12d3-a456-426614174000',
          // Missing other required fields
        },
      });

      const res = createResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Missing required fields',
        required: ['caseId', 'envelopeId', 'filingId', 'fileName', 'docType', 'status', 'timestamp'],
      });

      expect(mockSupabaseRpc).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid UUID format', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          ...validPayload,
          caseId: 'invalid-uuid',
        },
      });

      const res = createResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Invalid caseId format. Must be a valid UUID.',
      });

      expect(mockSupabaseRpc).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid timestamp format', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          ...validPayload,
          timestamp: 'invalid-timestamp',
        },
      });

      const res = createResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Invalid timestamp format. Must be a valid ISO 8601 date string.',
      });

      expect(mockSupabaseRpc).not.toHaveBeenCalled();
    });

    it('should return 404 for non-existent case', async () => {
      // Mock case not found error
      mockSupabaseRpc.mockResolvedValue({
        data: null,
        error: { message: 'Case with ID 123e4567-e89b-12d3-a456-426614174000 does not exist' },
      });

      const req = createRequest({
        method: 'POST',
        body: validPayload,
      });

      const res = createResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Case not found',
        details: 'The specified caseId does not exist',
      });
    });

    it('should return 409 for duplicate document', async () => {
      // Mock duplicate document error
      mockSupabaseRpc.mockResolvedValue({
        data: null,
        error: { message: 'Document with envelope_id ENV123 and filing_id FIL123 already exists' },
      });

      const req = createRequest({
        method: 'POST',
        body: validPayload,
      });

      const res = createResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(409);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Duplicate document',
        details: 'A document with this envelope ID and filing ID already exists',
      });
    });

    it('should return 500 for other database errors', async () => {
      // Mock other database error
      mockSupabaseRpc.mockResolvedValue({
        data: null,
        error: { message: 'Connection timeout' },
      });

      const req = createRequest({
        method: 'POST',
        body: validPayload,
      });

      const res = createResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Failed to create document',
        details: 'Connection timeout',
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
      mockSupabaseRpc.mockRejectedValue(new Error('Network error'));

      const req = createRequest({
        method: 'POST',
        body: validPayload,
      });

      const res = createResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Internal server error',
        message: 'Network error',
      });
    });

    it('should handle edge case UUID formats', async () => {
      // Clear any previous mocks
      vi.clearAllMocks();
      
      const edgeCasePayload = {
        ...validPayload,
        caseId: '00000000-0000-4000-8000-000000000000', // Valid UUID v4 format with minimal values
      };

      mockSupabaseRpc.mockResolvedValue({
        data: 'document-uuid-789',
        error: null,
      });

      const req = createRequest({
        method: 'POST',
        body: edgeCasePayload,
      });

      const res = createResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(201);
      expect(mockSupabaseRpc).toHaveBeenCalledWith('create_document_with_validation', {
        p_case_id: '00000000-0000-4000-8000-000000000000',
        p_envelope_id: 'ENV123',
        p_filing_id: 'FIL123',
        p_file_name: 'complaint.pdf',
        p_doc_type: 'document',
        p_efile_status: 'submitted',
        p_efile_timestamp: '2025-05-28T12:00:00.000Z',
      });
    });
  });
});