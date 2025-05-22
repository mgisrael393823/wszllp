import { defineConfig } from 'cypress';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(on, config) {
      // Create a task to read environment variables
      on('task', {
        getEnvVariable(varName) {
          return process.env[varName] || null;
        },
      });
      
      // Set environment variables from .env.local
      config.env = {
        ...config.env,
        VITE_EFILE_BASE_URL: process.env.VITE_EFILE_BASE_URL,
        // Don't include sensitive credentials by default
        // Set CYPRESS_INCLUDE_CREDENTIALS=1 to enable
        SKIP_REAL_API_TESTS: process.env.CYPRESS_INCLUDE_CREDENTIALS !== '1',
      };
      
      // Only include credentials if explicitly enabled
      if (process.env.CYPRESS_INCLUDE_CREDENTIALS === '1') {
        config.env.VITE_EFILE_CLIENT_TOKEN = process.env.VITE_EFILE_CLIENT_TOKEN;
        config.env.VITE_EFILE_USERNAME = process.env.VITE_EFILE_USERNAME;
        config.env.VITE_EFILE_PASSWORD = process.env.VITE_EFILE_PASSWORD;
      }
      
      return config;
    },
    specPattern: "cypress/e2e/**/*.{cy.js,cy.ts,cy.jsx,cy.tsx}",
    excludeSpecPattern: process.env.CYPRESS_INCLUDE_CREDENTIALS !== '1' 
      ? ["**/efile-real-api.cy.js"] 
      : [],
  },
  env: {
    apiUrl: 'http://localhost:3000/api', // Mock API URL
  },
  viewportWidth: 1280,
  viewportHeight: 800,
  video: false,
});