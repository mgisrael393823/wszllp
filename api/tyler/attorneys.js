import fetch from 'node-fetch';

// Use Tyler API credentials
const USERNAME = process.env.TYLER_API_USERNAME;
const PASSWORD = process.env.TYLER_API_PASSWORD;
const BASE_URL = 'https://api.uslegalpro.com/v4/il';
const CLIENT_TOKEN = 'EVICT87';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // First authenticate to get auth token
    const authResponse = await fetch(`${BASE_URL}/user/authenticate`, {
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
      throw new Error(`Authentication failed: ${authResponse.status}`);
    }

    const authData = await authResponse.json();
    const authToken = authData.item?.auth_token;

    if (!authToken) {
      throw new Error('No auth token received');
    }

    // Now fetch attorneys list
    const attorneysResponse = await fetch(`${BASE_URL}/firm/attorneys`, {
      method: 'GET',
      headers: {
        'authtoken': authToken
      }
    });

    if (!attorneysResponse.ok) {
      throw new Error(`Failed to fetch attorneys: ${attorneysResponse.status}`);
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
    res.status(500).json({ 
      error: 'Failed to fetch attorneys',
      message: error.message 
    });
  }
}