import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'src/tests/firestoreRulesEmulator.test.ts',
      'docs/kixidigital/kwik/repositorio-postgres.integration.test.ts',
    ],
  },
});

