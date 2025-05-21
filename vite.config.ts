import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@ui': path.resolve(__dirname, './src/components/ui'),
      '@lib': path.resolve(__dirname, './src/lib')
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['papaparse'],
  },
  ssr: {
    noExternal: ['papaparse'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
