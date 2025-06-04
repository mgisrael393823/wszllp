export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Return environment variable info (without exposing secrets)
  const envInfo = {
    method: req.method,
    hasViteUsername: !!process.env.VITE_EFILE_USERNAME,
    hasVitePassword: !!process.env.VITE_EFILE_PASSWORD,
    hasViteClientToken: !!process.env.VITE_EFILE_CLIENT_TOKEN,
    hasTylerUsername: !!process.env.TYLER_API_USERNAME,
    hasTylerPassword: !!process.env.TYLER_API_PASSWORD,
    hasTylerClientToken: !!process.env.TYLER_API_CLIENT_TOKEN,
    envVars: Object.keys(process.env).filter(k => 
      k.includes('TYLER') || k.includes('EFILE') || k.includes('VITE')
    ).sort(),
    nodeVersion: process.version
  };
  
  res.status(200).json(envInfo);
}