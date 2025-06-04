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
    const BASE_URL = process.env.TYLER_API_BASE_URL || process.env.VITE_EFILE_BASE_URL || 'https://api.uslegalpro.com/v4';
    const CLIENT_TOKEN = (process.env.TYLER_API_CLIENT_TOKEN || process.env.VITE_EFILE_CLIENT_TOKEN || 'EVICT87')
      .replace(/\\n/g, '').replace(/[\r\n\t]/g, '').trim();
    const USERNAME = (process.env.TYLER_API_USERNAME || process.env.VITE_EFILE_USERNAME || '')
      .replace(/\\n/g, '').replace(/[\r\n\t]/g, '').trim();
    const PASSWORD = (process.env.TYLER_API_PASSWORD || process.env.VITE_EFILE_PASSWORD || '')
      .replace(/\\n/g, '').replace(/[\r\n\t]/g, '').trim();

    // Check if credentials are available
    if (!USERNAME || !PASSWORD) {
      console.error('Tyler API credentials not configured');
      
      // Return attorney ID format for manual entry
      return res.status(200).json({ 
        attorneys: [
          {
            id: '448c583f-aaf7-43d2-8053-2b49c810b66f',
            firmId: '5f41beaa-13d4-4328-b87b-5d7d852f9491',
            barNumber: '',
            firstName: '',
            middleName: '',
            lastName: '',
            displayName: 'Enter Attorney ID Manually'
          }
        ],
        error: null,
        count: 1
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
    
    // Always return the actual error with empty attorneys list
    console.error('Tyler API error:', error.message);
    
    res.status(200).json({ 
      attorneys: [],
      error: `Unable to load attorneys: ${error.message}. Please contact support.`,
      count: 0
    });
  }
}