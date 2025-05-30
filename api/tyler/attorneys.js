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
    // Note: Vercel Functions cannot access VITE_ prefixed variables, only build process can
    const BASE_URL = process.env.TYLER_API_BASE_URL || 'https://api.uslegalpro.com/v4';
    const CLIENT_TOKEN = process.env.TYLER_API_CLIENT_TOKEN || 'EVICT87';
    const USERNAME = process.env.TYLER_API_USERNAME;
    const PASSWORD = process.env.TYLER_API_PASSWORD;

    // Check if credentials are available
    if (!USERNAME || !PASSWORD) {
      console.log('Tyler API credentials not configured, using fallback data');
      
      // Use fallback data for development
      const { fallbackAttorneys } = await import('./attorneys-fallback.js');
      
      return res.status(200).json({ 
        attorneys: fallbackAttorneys,
        error: null,
        count: fallbackAttorneys.length
      });
    }

    // Import fetch dynamically
    const fetch = (await import('node-fetch')).default;

    // First authenticate to get auth token
    const authResponse = await fetch(`${BASE_URL}/il/user/authenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'clienttoken': CLIENT_TOKEN
      },
      body: JSON.stringify({
        data: {
          username: USERNAME,
          password: PASSWORD
        }
      })
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('Tyler auth failed:', authResponse.status, errorText);
      throw new Error(`Authentication failed: ${authResponse.status}`);
    }

    const authData = await authResponse.json();
    console.log('Auth response:', authData.message_code === 0 ? 'Success' : 'Failed');
    const authToken = authData.item?.auth_token;

    if (!authToken) {
      console.error('Auth data:', authData);
      throw new Error('No auth token received');
    }

    // Now fetch attorneys list
    console.log('Fetching attorneys from Tyler API...');
    console.log('Auth token:', authToken ? 'Present' : 'Missing');
    console.log('URL:', `${BASE_URL}/il/firm/attorneys`);
    
    const attorneysResponse = await fetch(`${BASE_URL}/il/firm/attorneys`, {
      method: 'GET',
      headers: {
        'authtoken': authToken
      }
    });

    console.log('Attorneys response status:', attorneysResponse.status);

    if (!attorneysResponse.ok) {
      const errorText = await attorneysResponse.text();
      console.error('Tyler API error response:', errorText);
      throw new Error(`Failed to fetch attorneys: ${attorneysResponse.status} - ${errorText}`);
    }

    const attorneysData = await attorneysResponse.json();

    // Format the response
    const attorneys = attorneysData.items?.map(attorney => ({
      id: attorney.id,
      firmId: attorney.firm_id,
      barNumber: attorney.bar_number,
      firstName: attorney.first_name,
      middleName: attorney.middle_name,
      lastName: attorney.last_name,
      displayName: attorney.display_name
    })) || [];

    res.status(200).json({ 
      attorneys,
      count: attorneysData.count || 0
    });
  } catch (error) {
    console.error('Error fetching attorneys:', error);
    
    // In production, return fallback data to keep the form functional
    if (process.env.NODE_ENV === 'production' || !USERNAME || !PASSWORD) {
      console.log('Using fallback attorney data due to API error');
      const { fallbackAttorneys } = await import('./attorneys-fallback.js');
      
      return res.status(200).json({ 
        attorneys: fallbackAttorneys,
        error: null,
        count: fallbackAttorneys.length
      });
    }
    
    // In development, return the actual error
    res.status(500).json({ 
      error: 'Failed to fetch attorneys',
      message: error.message 
    });
  }
}