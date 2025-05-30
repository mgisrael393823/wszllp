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
    const BASE_URL = process.env.EFILE_BASE_URL || process.env.VITE_EFILE_BASE_URL || 'https://api.uslegalpro.com/v4';
    const CLIENT_TOKEN = 'EVICT87';
    const USERNAME = process.env.EFILE_USERNAME || process.env.VITE_EFILE_USERNAME || process.env.TYLER_API_USERNAME;
    const PASSWORD = process.env.EFILE_PASSWORD || process.env.VITE_EFILE_PASSWORD || process.env.TYLER_API_PASSWORD;

    // Check if credentials are missing
    if (!USERNAME || !PASSWORD) {
      console.error('Tyler API credentials missing:', {
        hasUsername: !!USERNAME,
        hasPassword: !!PASSWORD,
        envVars: Object.keys(process.env).filter(k => k.includes('TYLER') || k.includes('EFILE')).sort()
      });
      throw new Error('Tyler API credentials not configured');
    }

    // Log environment check (without exposing secrets)
    console.log('Tyler API Config:', {
      baseUrl: BASE_URL,
      hasClientToken: !!CLIENT_TOKEN,
      hasUsername: !!USERNAME,
      hasPassword: !!PASSWORD,
      clientTokenLength: CLIENT_TOKEN?.length,
      usernameLength: USERNAME?.length
    });

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
      const errorText = await authRes.text();
      console.error('Tyler auth error:', {
        status: authRes.status,
        statusText: authRes.statusText,
        body: errorText.substring(0, 200) // First 200 chars of error
      });
      throw new Error(`Tyler auth failed: ${authRes.status}`);
    }

    const authData = await authRes.json();
    const token = authData.item.auth_token;

    // Fetch payment accounts
    const accountsRes = await fetch(`${BASE_URL}/il/payment_accounts`, {
      headers: { 'authtoken': token }
    });

    if (!accountsRes.ok) {
      throw new Error(`Failed to fetch payment accounts: ${accountsRes.status}`);
    }

    const accountsData = await accountsRes.json();
    const accounts = (accountsData.items || []).map(account => ({
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