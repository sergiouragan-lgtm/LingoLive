import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    pool: 'threads',
    setupFiles: ['src/tests/setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'src/tests/firestoreRulesEmulator.test.ts',
      'src/tests/firestoreLearningSecurityRules.test.ts',
    ],
  },
});

