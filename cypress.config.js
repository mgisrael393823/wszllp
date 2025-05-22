import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  env: {
    apiUrl: 'http://localhost:3000/api', // Mock API URL
  },
  viewportWidth: 1280,
  viewportHeight: 800,
  video: false,
});