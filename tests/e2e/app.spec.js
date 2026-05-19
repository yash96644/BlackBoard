import { test, expect } from '@playwright/test';

test.describe('Blackboard Web App E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads correctly and displays canvas', async ({ page }) => {
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('canvas').first()).toBeVisible();
  });

  test('toggles whiteboard mode', async ({ page }) => {
    const whiteboardBtn = page.getByRole('button', { name: /Whiteboard/i });
    const blackboardBtn = page.getByRole('button', { name: /Blackboard/i });

    if (await whiteboardBtn.isVisible()) {
      await whiteboardBtn.click();
      await blackboardBtn.click();
    }
  });

  test('performs basic drawing interaction', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    if (box) {
      // Simulate pointer down and move to draw a line
      await page.mouse.move(box.x + 50, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + 150, box.y + 150, { steps: 5 });
      await page.mouse.up();
      
      // Give time for requestAnimationFrame
      await page.waitForTimeout(100);
    }
  });
});
