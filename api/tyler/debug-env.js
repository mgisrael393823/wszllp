export default async function handler(req, res) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production' && !req.headers['x-debug-key']) {
    return res.status(404).json({ error: 'Not found' });
  }

  // List environment variables (without values)
  const envVars = Object.keys(process.env)
    .filter(key => key.includes('TYLER') || key.includes('EFILE') || key.includes('VITE'))
    .sort()
    .reduce((acc, key) => {
      acc[key] = process.env[key] ? `Set (${process.env[key].length} chars)` : 'Not set';
      return acc;
    }, {});

  return res.status(200).json({
    envVars,
    hasVitePrefix: Object.keys(process.env).some(k => k.startsWith('VITE_')),
    runtime: process.env.VERCEL ? 'Vercel' : 'Local',
    nodeEnv: process.env.NODE_ENV
  });
}