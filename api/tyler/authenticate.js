import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use server-side environment variables
    const username = process.env.VITE_EFILE_USERNAME;
    const password = process.env.VITE_EFILE_PASSWORD;
    const clientToken = process.env.VITE_EFILE_CLIENT_TOKEN || 'EVICT87';
    const baseUrl = process.env.VITE_EFILE_BASE_URL || 'https://api.uslegalpro.com/v4';

    if (!username || !password) {
      console.error('[Tyler Auth API] Missing credentials in environment');
      return res.status(500).json({ 
        error: 'E-Filing service not configured',
        message: 'Authentication credentials are not available' 
      });
    }

    console.log('[Tyler Auth API] Authenticating with Tyler API...');
    
    const response = await fetch(`${baseUrl}/il/user/authenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'clienttoken': clientToken,
      },
      body: JSON.stringify({
        data: { username, password }
      }),
    });

    const data = await response.json();

    if (response.ok && data.message_code === 0) {
      console.log('[Tyler Auth API] Authentication successful');
      res.status(200).json({
        success: true,
        token: data.item.auth_token,
        expires: Date.now() + 60 * 60 * 1000 // 1 hour
      });
    } else {
      console.error('[Tyler Auth API] Authentication failed:', data);
      res.status(response.status).json({
        error: 'Authentication failed',
        message: data.message || 'Invalid credentials',
        code: data.message_code
      });
    }
  } catch (error) {
    console.error('[Tyler Auth API] Error:', error);
    res.status(500).json({ 
      error: 'Authentication service error',
      message: error.message 
    });
  }
}