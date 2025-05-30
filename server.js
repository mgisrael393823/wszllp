import express from 'express';
import { createServer as createViteServer } from 'vite';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const app = express();
app.use(express.json());

// Tyler API handlers
app.get('/api/tyler/payment-accounts', async (req, res) => {
  try {
    const BASE_URL = process.env.VITE_EFILE_BASE_URL || 'https://api.uslegalpro.com/v4';
    const CLIENT_TOKEN = process.env.VITE_EFILE_CLIENT_TOKEN || 'EVICT87';
    const USERNAME = process.env.VITE_EFILE_USERNAME;
    const PASSWORD = process.env.VITE_EFILE_PASSWORD;

    if (!USERNAME || !PASSWORD) {
      console.error('Missing Tyler API credentials');
      return res.status(200).json({
        accounts: [{ id: 'demo', name: 'Demo Account (Dev Mode)' }]
      });
    }

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
      console.error('Tyler auth failed:', authRes.status, errorText);
      return res.status(200).json({
        accounts: [{ id: 'demo', name: 'Demo Account (Auth Failed)' }]
      });
    }

    const authData = await authRes.json();
    const token = authData.item.auth_token;

    // Fetch payment accounts
    const accountsRes = await fetch(`${BASE_URL}/il/payment_accounts`, {
      headers: { 'authtoken': token }
    });

    if (!accountsRes.ok) {
      console.error('Failed to fetch payment accounts:', accountsRes.status);
      return res.status(200).json({
        accounts: [{ id: 'demo', name: 'Demo Account (Fetch Failed)' }]
      });
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
      accounts: [{ id: 'demo', name: 'Demo Account (Error)' }],
      error: error.message
    });
  }
});

app.get('/api/tyler/jurisdictions', async (req, res) => {
  // Return static jurisdictions for Cook County
  const jurisdictions = [
    { code: 'cook:cvd1', name: 'Cook County District 1 - Civil' },
    { code: 'cook:m1', name: 'Cook County Municipal District 1' },
    { code: 'cook:m2', name: 'Cook County Municipal District 2' },
    { code: 'cook:m3', name: 'Cook County Municipal District 3' },
    { code: 'cook:m4', name: 'Cook County Municipal District 4' },
    { code: 'cook:m5', name: 'Cook County Municipal District 5' },
    { code: 'cook:m6', name: 'Cook County Municipal District 6' }
  ];
  res.json({ jurisdictions });
});

// Create Vite server in middleware mode
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'spa'
});

// Use Vite's middleware
app.use(vite.middlewares);

const PORT = 5179;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/*`);
});