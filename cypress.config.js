import { defineConfig } from 'cypress';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

// Detect CI environment and adjust timeouts
const isCI = Boolean(process.env.CI);
const timeoutMultiplier = isCI ? 1.5 : 1;

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5178',
    setupNodeEvents(on, config) {
      // Setup task for accessing environment variables
      on('task', {
        getEnvVariable(name) {
          return process.env[name] || null;
        }
      });
      
      return config;
    },
  },
  env: {
    apiUrl: 'http://localhost:3000/api',
    productionUrl: process.env.PRODUCTION_URL || 'https://wszllp-ddh6cl3y4-m-learsicos-projects.vercel.app',
    TYLER_API_USERNAME: process.env.TYLER_API_USERNAME,
    TYLER_API_PASSWORD: process.env.TYLER_API_PASSWORD,
    VITE_EFILE_CLIENT_TOKEN: process.env.VITE_EFILE_CLIENT_TOKEN,
  },
  // Timeout & retry configuration
  defaultCommandTimeout: Math.round(10000 * timeoutMultiplier),
  pageLoadTimeout: Math.round(60000 * timeoutMultiplier),
  requestTimeout: Math.round(20000 * timeoutMultiplier),
  responseTimeout: Math.round(20000 * timeoutMultiplier),
  retries: {
    runMode: 2,
    openMode: 0,
  },
  viewportWidth: 1280,
  viewportHeight: 800,
  video: false,
});