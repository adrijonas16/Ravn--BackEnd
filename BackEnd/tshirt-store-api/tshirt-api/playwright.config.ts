import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  testMatch: 'demo-recording.spec.ts',
  timeout: 30000,
  use: {
    video: 'on',
    trace: 'on',
    screenshot: 'on',
  },
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  outputDir: 'test-results',
});
