import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/test/**/*.test.ts'],
    alias: {
      vscode: path.resolve(__dirname, 'src/test/__mocks__/vscode.ts'),
    },
  },
});
