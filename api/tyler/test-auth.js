export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Direct test of Tyler API authentication
  const username = (process.env.TYLER_API_USERNAME || process.env.VITE_EFILE_USERNAME || '')
    .replace(/\\n/g, '').replace(/[\r\n\t]/g, '').trim();
  const password = (process.env.TYLER_API_PASSWORD || process.env.VITE_EFILE_PASSWORD || '')
    .replace(/\\n/g, '').replace(/[\r\n\t]/g, '').trim();
  const clientToken = (process.env.TYLER_API_CLIENT_TOKEN || process.env.VITE_EFILE_CLIENT_TOKEN || 'EVICT87')
    .replace(/\\n/g, '').replace(/[\r\n\t]/g, '').trim();
  const url = process.env.TYLER_API_BASE_URL || process.env.VITE_EFILE_BASE_URL || 'https://api.uslegalpro.com/v4';
  
  if (!username || !password) {
    return res.status(400).json({
      error: 'Missing credentials',
      message: 'Tyler API credentials not configured'
    });
  }

  try {
    const response = await fetch(`${url}/il/user/authenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'clienttoken': clientToken,
      },
      body: JSON.stringify({
        data: { username, password }
      })
    });

    const responseText = await response.text();
    
    return res.status(200).json({
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText,
      parsed: (() => {
        try {
          return JSON.parse(responseText);
        } catch {
          return null;
        }
      })()
    });
  } catch (error) {
    return res.status(200).json({
      error: error.message,
      stack: error.stack
    });
  }
}