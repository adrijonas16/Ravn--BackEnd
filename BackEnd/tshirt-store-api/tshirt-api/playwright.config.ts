import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  testMatch: 'demo-recording.spec.ts',
  timeout: 60000,
  use: {
    video: { mode: 'on', size: { width: 1920, height: 1080 } },
    trace: 'on',
    screenshot: 'on',
    viewport: { width: 1920, height: 1080 },
  },
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  outputDir: 'test-results',
});
