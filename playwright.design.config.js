import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/design',
  outputDir: './test-results/design',
  timeout: 30000,
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5175',
    browserName: 'chromium',
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm run dev --workspace frontend -- --port 5175',
      url: 'http://127.0.0.1:5175',
      reuseExistingServer: false,
    },
    {
      command: 'npm run preview --workspace frontend -- --port 4175',
      url: 'http://127.0.0.1:4175',
      reuseExistingServer: false,
    },
  ],
});
