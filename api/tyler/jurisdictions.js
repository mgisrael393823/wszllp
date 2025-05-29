export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  // Tyler API doesn't provide a jurisdictions endpoint - jurisdictions are static codes
  // Return Phase B Cook County Municipal Civil District codes (M1-M6)
  try {
    const { JURISDICTIONS } = await import('./jurisdictions-fallback.js');
    return res.status(200).json({ 
      jurisdictions: JURISDICTIONS, 
      cached_at: new Date().toISOString(),
      source: 'static_config'
    });
  } catch (importError) {
    console.error('Failed to load jurisdictions:', importError);
    return res.status(500).json({ 
      error: 'Failed to load jurisdictions', 
      jurisdictions: [] 
    });
  }
}