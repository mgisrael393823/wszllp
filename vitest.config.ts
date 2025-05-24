import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load environment variables from .env.test for testing
  const env = loadEnv('test', process.cwd(), '');
  
  return {
    test: {
      globals: true,
      environment: 'jsdom',
      include: ['tests/**/*.{test,spec}.{js,ts,jsx,tsx}'],
      exclude: ['node_modules', 'dist', 'cypress', 'tests/integration/**'],
      setupFiles: ['./tests/setup.ts'],
      env: {
        // Provide mock Supabase values for unit tests
        VITE_SUPABASE_URL: env.VITE_SUPABASE_URL || 'https://mock-project.supabase.co',
        VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY || 'mock-anon-key',
        SUPABASE_SERVICE_KEY: env.SUPABASE_SERVICE_KEY || 'mock-service-key',
        VITE_EFILE_BASE_URL: env.VITE_EFILE_BASE_URL || 'https://mock-api.example.com/v4',
      },
      coverage: {
        reporter: ['text', 'lcov'],
        exclude: ['node_modules/', 'tests/', 'src/mocks/'],
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  };
});