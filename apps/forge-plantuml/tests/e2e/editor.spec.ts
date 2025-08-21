import { test, expect } from '@playwright/test';

test.describe('PlantUML Editor', () => {
  test('should load editor interface', async ({ page }) => {
    await page.goto('/src/editor.html');
    
    // Check main components are present
    await expect(page.locator('.app')).toBeVisible();
    await expect(page.locator('.editor-panel')).toBeVisible();
    await expect(page.locator('.preview-panel')).toBeVisible();
    
    // Check toolbar elements
    await expect(page.locator('select[value="svg"]')).toBeVisible();
    await expect(page.locator('button:has-text("Render")')).toBeVisible();
  });

  test('should show preview content', async ({ page }) => {
    await page.goto('/src/editor.html');
    
    // Wait for initial render
    await page.waitForTimeout(1000);
    
    // Check preview shows content
    const preview = page.locator('.preview-content');
    await expect(preview).toBeVisible();
    
    // Should show either loading, error, or content
    const hasContent = await preview.locator('.diagram-container, .loading, .error').count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test('should handle format change', async ({ page }) => {
    await page.goto('/src/editor.html');
    
    // Change format to PNG
    await page.selectOption('select', 'png');
    
    // Verify format is changed
    const formatSelect = page.locator('select').first();
    await expect(formatSelect).toHaveValue('png');
  });

  test('should handle render button click', async ({ page }) => {
    await page.goto('/src/editor.html');
    
    // Click render button
    const renderButton = page.locator('button:has-text("Render")');
    await renderButton.click();
    
    // Should show rendering state
    await expect(page.locator('button:has-text("Rendering...")')).toBeVisible();
  });

  test('should handle keyboard shortcut', async ({ page }) => {
    await page.goto('/src/editor.html');
    
    // Focus on editor area
    await page.locator('.editor-container').click();
    
    // Press Ctrl+Enter (or Cmd+Enter on Mac)
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+Enter`);
    
    // Should trigger render
    await expect(page.locator('button:has-text("Rendering...")')).toBeVisible();
  });
});