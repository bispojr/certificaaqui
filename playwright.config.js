// @ts-check
process.env.NODE_ENV = 'e2e'

const { defineConfig, devices } = require('@playwright/test')

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.js',
  globalSetup: './tests/e2e/setup/globalSetup.js',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'NODE_ENV=e2e node ./bin/www',
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 15_000,
  },
})
