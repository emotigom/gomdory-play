import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    fileParallelism: false,
    isolate: false,
    maxWorkers: 1,
    pool: 'threads',
    setupFiles: './src/test/setup.ts',
  },
});
