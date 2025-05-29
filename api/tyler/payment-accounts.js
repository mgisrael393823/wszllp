export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use server-side Tyler authentication with Vercel environment variables
    const BASE_URL = process.env.VITE_EFILE_BASE_URL || 'https://api.uslegalpro.com/v4';
    const CLIENT_TOKEN = process.env.VITE_EFILE_CLIENT_TOKEN;
    const USERNAME = process.env.VITE_TYLER_API_USERNAME;
    const PASSWORD = process.env.VITE_TYLER_API_PASSWORD;

    // Authenticate with Tyler API
    const authRes = await fetch(`${BASE_URL}/il/user/authenticate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'clienttoken': CLIENT_TOKEN 
      },
      body: JSON.stringify({ 
        data: { username: USERNAME, password: PASSWORD } 
      })
    });

    if (!authRes.ok) {
      throw new Error(`Tyler auth failed: ${authRes.status}`);
    }

    const authData = await authRes.json();
    const token = authData.item.auth_token;

    // Fetch payment accounts
    const accountsRes = await fetch(`${BASE_URL}/il/payment-accounts`, {
      headers: { 'authtoken': token }
    });

    if (!accountsRes.ok) {
      throw new Error(`Failed to fetch payment accounts: ${accountsRes.status}`);
    }

    const accountsData = await accountsRes.json();
    const accounts = (accountsData.item || []).map(account => ({
      id: account.id,
      name: account.name || account.description || 'Payment Account'
    }));

    return res.status(200).json({ accounts });

  } catch (error) {
    console.error('Payment accounts API error:', error);
    return res.status(200).json({
      accounts: [{ id: 'demo', name: 'Demo Account (Fallback)' }],
      error: error.message
    });
  }
}