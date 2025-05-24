import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load environment variables from .env.test for integration testing
  const env = loadEnv('test', process.cwd(), '');
  
  return {
    test: {
      globals: true,
      environment: 'jsdom',
      include: ['tests/integration/**/*.{test,spec}.{js,ts,jsx,tsx}'],
      exclude: ['node_modules', 'dist', 'cypress'],
      env: {
        // Use real environment variables for integration tests
        VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_KEY: env.SUPABASE_SERVICE_KEY,
      },
      testTimeout: 30000, // Longer timeout for database operations
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  };
});