import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['line'], ['html', { open: 'never', outputFolder: 'playwright-report' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run dev',
    url: baseURL + '/en',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/solutions_gate',
      AUTH_SECRET: process.env.AUTH_SECRET || 'phase3-local-e2e-secret-with-more-than-thirty-two-characters',
      APP_URL: baseURL,
      NEXTAUTH_URL: baseURL,
      STORAGE_DRIVER: 'local',
      LOCAL_UPLOAD_DIR: 'public/e2e-uploads',
      MAX_UPLOAD_BYTES: '10485760',
      MAIL_PROVIDER: 'none',
      RATE_LIMIT_WINDOW_SECONDS: '60',
      RATE_LIMIT_MAX: '50'
    }
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: /performance\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }
    },
    {
      name: 'firefox',
      testMatch: /browser-smoke\.spec\.ts/,
      use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } }
    },
    {
      name: 'webkit',
      testMatch: /browser-smoke\.spec\.ts/,
      use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } }
    },
    {
      name: 'android-chromium',
      testMatch: /browser-smoke\.spec\.ts/,
      use: { ...devices['Pixel 7'] }
    },
    {
      name: 'ios-webkit',
      testMatch: /browser-smoke\.spec\.ts/,
      use: { ...devices['iPhone 13'] }
    }
  ]
});
