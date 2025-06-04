// @ts-check
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Authenticate with the e-filing API
 * @param {Object} params
 * @param {string} params.username
 * @param {string} params.password
 */
async function authenticate({ username, password }) {
  const baseURL = process.env.VITE_EFILE_BASE_URL;
  const clientToken = process.env.VITE_EFILE_CLIENT_TOKEN;
  
  if (!baseURL || !clientToken) {
    throw new Error('Missing required environment variables: VITE_EFILE_BASE_URL or VITE_EFILE_CLIENT_TOKEN');
  }
  
  console.log(`Authenticating with ${baseURL}/il/user/authenticate`);
  console.log(`Using client token: ${clientToken.substring(0, 2)}${'*'.repeat(clientToken.length - 2)}`);
  console.log(`Username: ${username}`);
  console.log(`Password: ${'*'.repeat(password.length)}`);
  
  try {
    const response = await axios.post(
      `${baseURL}/il/user/authenticate`,
      { data: { username, password } },
      { headers: { clienttoken: clientToken } }
    );
    
    return response.data.item.auth_token;
  } catch (error) {
    console.error('Authentication error:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else {
      console.error(error.message);
    }
    throw error;
  }
}

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