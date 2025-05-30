export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Direct test of Tyler API authentication
  const username = 'czivin@wolfsolovy.com';
  const password = 'Zuj90820*';
  const clientToken = 'EVICT87';
  const url = 'https://api.uslegalpro.com/v4/il/user/authenticate';

  try {
    const response = await fetch(url, {
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