import { defineConfig } from 'cypress';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5178',
  },
  env: {
    apiUrl: 'http://localhost:3000/api', // Mock API URL
  },
  viewportWidth: 1280,
  viewportHeight: 800,
  video: false,
});