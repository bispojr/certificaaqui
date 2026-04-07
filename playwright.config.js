// @ts-check
const { defineConfig, devices } = require('@playwright/test')

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
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
    command: 'node ./bin/www',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 15_000,
  },
})
