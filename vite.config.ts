import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      dedupe: ['react', 'react-dom'],
    },
    server: {
      // HMR is disabled in AI Studio to prevent WebSocket connection failures
      hmr: false,
      watch: null,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Firebase chunk
            if (id.includes('node_modules/firebase')) {
              return 'vendor-firebase';
            }
            // React chunk
            if (id.includes('node_modules/react')) {
              return 'vendor-react';
            }
            // UI libraries chunk
            if (id.includes('node_modules/lucide-react') ||
                id.includes('node_modules/recharts') ||
                id.includes('node_modules/motion')) {
              return 'vendor-ui';
            }
            // Large utilities
            if (id.includes('node_modules/html2canvas') ||
                id.includes('node_modules/dompurify')) {
              return 'vendor-utils';
            }
            // Core services shared across features
            if (id.includes('src/services/') ||
                id.includes('src/context/') ||
                id.includes('src/hooks/') ||
                id.includes('src/utils/')) {
              return 'shared-core';
            }
            // Feature chunks
            if (id.includes('src/components/admin')) {
              return 'feature-admin';
            }
            if (id.includes('src/components/b2b')) {
              return 'feature-b2b';
            }
            if (id.includes('src/components/marketplace')) {
              return 'feature-marketplace';
            }
            if (id.includes('src/components/live')) {
              return 'feature-live';
            }
            if (id.includes('src/components/learning/ebook')) {
              return 'feature-ebook';
            }
            if (id.includes('src/components/ai-tutor')) {
              return 'feature-ai-tutor';
            }
            // Large learning components
            if (id.includes('src/components/learning/')) {
              return 'feature-learning';
            }
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
        },
      },
      chunkSizeWarningLimit: 500,
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.log in production
          dead_code: true,
        },
      },
    },
  };
});
