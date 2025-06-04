import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use server-side environment variables
    const username = process.env.VITE_EFILE_USERNAME || '';
    const password = process.env.VITE_EFILE_PASSWORD || '';
    const clientToken = process.env.VITE_EFILE_CLIENT_TOKEN || 'EVICT87';
    const baseUrl = process.env.VITE_EFILE_BASE_URL || 'https://api.uslegalpro.com/v4';

    // Clean up any newlines or spaces
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();
    const cleanClientToken = clientToken.trim();

    if (!cleanUsername || !cleanPassword) {
      console.error('[Tyler Auth API] Missing credentials in environment');
      return res.status(500).json({ 
        error: 'E-Filing service not configured',
        message: 'Authentication credentials are not available' 
      });
    }

    console.log('[Tyler Auth API] Authenticating with Tyler API...');
    console.log('[Tyler Auth API] Username:', cleanUsername.substring(0, 3) + '***');
    console.log('[Tyler Auth API] Client Token:', cleanClientToken);
    
    const response = await fetch(`${baseUrl}/il/user/authenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'clienttoken': cleanClientToken,
      },
      body: JSON.stringify({
        data: { 
          username: cleanUsername, 
          password: cleanPassword 
        }
      }),
    });

    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('[Tyler Auth API] Invalid JSON response:', responseText);
      return res.status(500).json({
        error: 'Invalid response from Tyler API',
        message: 'The authentication service returned an invalid response'
      });
    }

    if (response.ok && data.message_code === 0) {
      console.log('[Tyler Auth API] Authentication successful');
      res.status(200).json({
        success: true,
        token: data.item.auth_token,
        expires: Date.now() + 60 * 60 * 1000 // 1 hour
      });
    } else {
      console.error('[Tyler Auth API] Authentication failed:', data);
      res.status(response.status || 400).json({
        error: 'Authentication failed',
        message: data.message || 'Invalid credentials',
        code: data.message_code
      });
    }
  } catch (error) {
    console.error('[Tyler Auth API] Error:', error);
    res.status(500).json({ 
      error: 'Authentication service error',
      message: error.message || 'An unexpected error occurred'
    });
  }
}