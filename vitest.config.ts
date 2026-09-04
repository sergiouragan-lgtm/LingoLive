import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['src/tests/setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'src/tests/firestoreRulesEmulator.test.ts'],
  },
});

