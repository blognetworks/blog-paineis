import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:4001',
    viewport: { width: 1200, height: 650 },
    serviceWorkers: 'block',
  },
  webServer: {
    command: 'npm run build && bundle exec jekyll serve --host 127.0.0.1 --port 4001 --no-watch',
    url: 'http://127.0.0.1:4001/',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
