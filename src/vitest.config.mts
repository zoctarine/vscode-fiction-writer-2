import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,                  // Use Jest-like global APIs
        environment: 'node',           // Use 'node' if DOM APIs aren't required
        include: ['src/test/**/*.test.ts'], // Path to your test files
        testTimeout: 5000,              // Optional: Customize test timeout
    },
});