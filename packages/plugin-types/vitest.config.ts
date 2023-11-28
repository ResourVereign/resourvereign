import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      enabled: true,
    },
    include: ['src/**/*.spec.*'],
  },
});
