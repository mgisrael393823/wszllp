import { authenticate, fetchPaymentAccounts } from '../../utils/efile/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = await authenticate();
    const accounts = await fetchPaymentAccounts(token);
    return res.status(200).json({ accounts });
  } catch (error) {
    console.error('Failed to fetch payment accounts:', error);
    return res.status(200).json({
      accounts: [{ id: 'demo', name: 'Demo Account (Fallback)' }],
      error: error.message
    });
  }
}
