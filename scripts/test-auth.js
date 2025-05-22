// @ts-check
import dotenv from 'dotenv';
import { authenticate } from '../src/utils/efile/auth.ts';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Main execution
(async () => {
  try {
    const username = process.env.VITE_EFILE_USERNAME;
    const password = process.env.VITE_EFILE_PASSWORD;
    
    if (!username || !password) {
      throw new Error('Missing required environment variables: VITE_EFILE_USERNAME or VITE_EFILE_PASSWORD');
    }
    
    const token = await authenticate({ username, password });
    console.log('\nAuthentication successful!');
    console.log(`Token: ${token.substring(0, 10)}...${token.substring(token.length - 5)}`);
    console.log(`Token length: ${token.length} characters`);
  } catch (error) {
    console.error('\nAuthentication failed:', error.message);
    process.exit(1);
  }
})();