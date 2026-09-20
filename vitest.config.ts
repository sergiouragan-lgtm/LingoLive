import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/tests/setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'src/tests/firestoreRulesEmulator.test.ts',
      'tests/integration/**',
      'tests/e2e/**',
      'tests/performance/**',
    ],
  },
});

