import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { useEffect } from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

vi.stubGlobal('fetch', vi.fn());
const { usePaymentAccounts } = await import('../../../src/components/efile/EFileSubmissionForm.tsx');

describe('usePaymentAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function render(cb: (state:any)=>void) {
    const div = document.createElement('div');
    const root = createRoot(div);
    function Test() {
      const state = usePaymentAccounts();
      useEffect(() => { cb(state); }, [state]);
      return null;
    }
    act(() => { root.render(React.createElement(Test)); });
  }

  it('loads accounts successfully', async () => {
    (fetch as any).mockResolvedValue({ ok: true, json: () => Promise.resolve({ accounts: [{ id: '1', name: 'A' }] }) });
    let result: any;
    render(r => { result = r; });
    await act(async () => {});
    expect(result.accounts.length).toBe(1);
  });

  it('provides fallback on error', async () => {
    (fetch as any).mockRejectedValue(new Error('fail'));
    let result: any;
    render(r => { result = r; });
    await act(async () => {});
    expect(result.error).toBeTruthy();
  });
});
