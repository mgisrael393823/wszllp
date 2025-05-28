import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequest, createResponse } from 'node-mocks-http';

const mockSupabaseRpc = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    rpc: mockSupabaseRpc,
  })),
}));

const handler = await import('../../../api/cases.js').then(m => m.default);

describe('Enhanced /api/cases endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates case with enhanced payload', async () => {
    mockSupabaseRpc.mockResolvedValue({ data: 'case-1', error: null });

    const req = createRequest({
      method: 'POST',
      body: {
        userId: 'u1',
        jurisdiction: 'il',
        county: 'cook',
        caseType: '174140',
        attorneyId: 'A1',
        referenceId: 'REF',
        paymentAccountId: 'PA1',
        amountInControversy: '1000.00',
        showAmountInControversy: true,
        petitioner: {
          type: 'business',
          businessName: 'ACME',
          addressLine1: '1 Main',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601'
        },
        defendants: [
          { firstName: 'John', lastName: 'Doe', addressLine1: '2 St', city: 'Chi', state: 'IL', zipCode: '60602' }
        ]
      },
    });
    const res = createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(201);
    expect(mockSupabaseRpc).toHaveBeenCalledWith('create_case_with_transaction', expect.objectContaining({
      p_payment_account_id: 'PA1',
      p_amount_in_controversy: '1000.00',
      p_show_amount_in_controversy: true
    }));
  });

  it('accepts legacy payload without new fields', async () => {
    mockSupabaseRpc.mockResolvedValue({ data: 'case-2', error: null });

    const req = createRequest({
      method: 'POST',
      body: {
        userId: 'u1',
        jurisdiction: 'il',
        county: 'cook',
        caseType: 'eviction',
        attorneyId: 'A1',
        referenceId: 'REF'
      },
    });
    const res = createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(201);
  });
});
