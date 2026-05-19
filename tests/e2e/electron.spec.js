import { _electron as electron } from '@playwright/test';
import { test, expect } from '@playwright/test';

test.describe('Blackboard Electron Tests', () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    // Launch Electron app
    electronApp = await electron.launch({ args: ['.'] });
    window = await electronApp.firstWindow();
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('launches electron app successfully', async () => {
    const isPackaged = await electronApp.evaluate(async ({ app }) => {
      return app.isPackaged;
    });
    expect(isPackaged).toBeDefined();
    
    // Verify window is visible and rendering
    const title = await window.title();
    expect(title).toMatch(/Blackboard/i);
  });
});
