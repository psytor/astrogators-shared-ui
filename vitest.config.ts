import { defineConfig } from 'vitest/config';

// Separate from vite.config.ts on purpose: that one loads the dts + react
// plugins for the library build, which tests don't need.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
