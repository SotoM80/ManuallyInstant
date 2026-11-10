import { defineConfig, devices } from '@playwright/test'

// Layout tests in a real browser (ADR 0030): what jsdom cannot do, like measuring text.
// They start their own dev server on 5175, so a `npm run dev` on 5173 can keep running.
export default defineConfig({
  testDir: './e2e',
  timeout: 180_000,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5175',
    viewport: { width: 1440, height: 900 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: 'npm run dev -- --port 5175 --strictPort',
    url: 'http://localhost:5175',
    reuseExistingServer: false,
  },
})
