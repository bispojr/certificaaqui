// @ts-check
process.env.NODE_ENV = 'e2e'

const { defineConfig, devices } = require('@playwright/test')
require('dotenv').config()

const PORT = process.env.PORT_E2E || process.env.PORT || '3000'
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`

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
    command: `NODE_ENV=e2e PORT=${PORT} node ./bin/www`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
})
