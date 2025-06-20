import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'tyler-api-proxy',
      configureServer(server) {
        // Proxy Tyler API requests to the actual API in development
        server.middlewares.use(async (req, res, next) => {
          if (req.url?.startsWith('/api/tyler/')) {
            const { config } = await import('dotenv');
            config({ path: '.env.local' });
            
            try {
              if (req.url === '/api/tyler/payment-accounts') {
                // Authenticate first
                const authResponse = await fetch('https://api.uslegalpro.com/v4/il/user/authenticate', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'clienttoken': process.env.VITE_EFILE_CLIENT_TOKEN || 'EVICT87'
                  },
                  body: JSON.stringify({
                    data: {
                      username: process.env.VITE_EFILE_USERNAME,
                      password: process.env.VITE_EFILE_PASSWORD
                    }
                  })
                });

                if (!authResponse.ok) {
                  throw new Error('Authentication failed');
                }

                const authData = await authResponse.json();
                const authToken = authData.item.auth_token;

                // Fetch payment accounts
                const accountsResponse = await fetch('https://api.uslegalpro.com/v4/il/payment_accounts', {
                  headers: {
                    'authtoken': authToken
                  }
                });

                if (!accountsResponse.ok) {
                  throw new Error('Failed to fetch payment accounts');
                }

                const accountsData = await accountsResponse.json();
                const accounts = (accountsData.items || []).map(account => ({
                  id: account.id,
                  name: `${account.name} (${account.card_type || account.type_code})`
                }));

                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify({ accounts }));
                return;
              }
            } catch (error) {
              console.error('Tyler API proxy error:', error);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
              return;
            }
          }
          next();
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@ui': path.resolve(__dirname, './src/components/ui'),
      '@lib': path.resolve(__dirname, './src/lib')
    },
  },
  server: {
    port: 5178,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['papaparse'],
  },
  ssr: {
    noExternal: ['papaparse'],
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      external: [
        /^dev-tools\//,
        'agent.ts',
        'refactor.ts'
      ],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (id.includes('lucide-react')) return 'vendor-icons';
          }
        }
      }
    }
  },
});