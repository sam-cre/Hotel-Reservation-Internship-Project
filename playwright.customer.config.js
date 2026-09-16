import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/customer',
  outputDir: './test-results/customer',
  timeout: 30000,
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5176',
    browserName: 'chromium',
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev --workspace frontend -- --port 5176',
    url: 'http://127.0.0.1:5176',
    reuseExistingServer: false,
  },
});
