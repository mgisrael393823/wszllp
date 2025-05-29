export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  try {
    const BASE_URL = process.env.VITE_EFILE_BASE_URL || 'https://api.uslegalpro.com/v4';
    const CLIENT_TOKEN = process.env.VITE_EFILE_CLIENT_TOKEN;
    const USERNAME = process.env.TYLER_API_USERNAME;
    const PASSWORD = process.env.TYLER_API_PASSWORD;

    // Authenticate
    const authRes = await fetch(`${BASE_URL}/il/user/authenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'clienttoken': CLIENT_TOKEN
      },
      body: JSON.stringify({ data: { username: USERNAME, password: PASSWORD } })
    });
    if (!authRes.ok) throw new Error(`Tyler auth failed: ${authRes.status}`);
    const authData = await authRes.json();
    const token = authData.item.auth_token;

    // Fetch jurisdictions
    const response = await fetch(`${BASE_URL}/il/jurisdictions`, { headers: { authtoken: token } });
    if (!response.ok) throw new Error(`Tyler API error: ${response.status}`);
    const data = await response.json();
    return res.status(200).json({ jurisdictions: data.items || [], cached_at: new Date().toISOString() });
  } catch (error) {
    console.error('Jurisdiction fetch error:', error);
    const { JURISDICTIONS } = await import('../../src/config/jurisdictions.js');
    return res.status(500).json({ error: 'Failed to fetch jurisdictions', jurisdictions: JURISDICTIONS, fallback: true });
  }
}
