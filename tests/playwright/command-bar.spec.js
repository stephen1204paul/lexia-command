import { test, expect } from '@playwright/test';
import { ensureLoggedIn } from './helpers/wordpress-auth.js';

test.describe('Lexia Command Bar', () => {
  test.beforeEach(async ({ page }) => {
    // Log in to WordPress admin
    await ensureLoggedIn(page);
    
    // Wait for the page to load completely
    await page.waitForTimeout(1000);
  });

  test('should open when keyboard shortcut is pressed', async ({ page }) => {
    // Press CMD+K (or CTRL+K)
    await page.keyboard.press('Meta+k');
    
    // Verify command bar is visible
    await expect(page.locator('#lexia-command-root .lexia-command-modal')).toBeVisible();
  });

  test('should close when Escape key is pressed', async ({ page }) => {
    // Open command bar
    await page.keyboard.press('Meta+k');
    
    // Verify command bar is visible
    await expect(page.locator('#lexia-command-root .lexia-command-modal')).toBeVisible();
    
    // Press Escape key
    await page.keyboard.press('Escape');
    
    // Verify command bar is closed
    await expect(page.locator('#lexia-command-root .lexia-command-modal')).not.toBeVisible();
  });

  test('should search for content when typing', async ({ page }) => {
    // Open command bar
    await page.keyboard.press('Meta+k');
    
    // Type search query
    await page.locator('#lexia-command-root .lexia-command-search').fill('test');
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Verify search results are displayed
    await expect(page.locator('#lexia-command-root .lexia-command-result')).toBeVisible();
  });

  test('should navigate between search results with arrow keys', async ({ page }) => {
    // Open command bar
    await page.keyboard.press('Meta+k');
    
    // Type search query
    await page.locator('#lexia-command-root .lexia-command-search').fill('test');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Press down arrow to select first result
    await page.keyboard.press('ArrowDown');
    
    // Verify first result is selected
    await expect(page.locator('#lexia-command-root .lexia-command-result').first()).toHaveAttribute('data-selected', 'true');
  });

  test('should handle cross-platform keyboard shortcuts', async ({ page }) => {
    // Test Ctrl+K for Windows/Linux
    await page.keyboard.press('Control+k');
    
    // Verify command bar is visible
    await expect(page.locator('#lexia-command-root .lexia-command-modal')).toBeVisible();
    
    // Close command bar
    await page.keyboard.press('Escape');
    
    // Test Meta+K for macOS
    await page.keyboard.press('Meta+k');
    
    // Verify command bar is visible again
    await expect(page.locator('#lexia-command-root .lexia-command-modal')).toBeVisible();
  });

  test('should show accessibility features', async ({ page }) => {
    // Open command bar
    await page.keyboard.press('Meta+k');
    
    // Test high contrast toggle
    await page.keyboard.press('Alt+h');
    
    // Test reduced motion toggle
    await page.keyboard.press('Alt+m');
    
    // Test larger font toggle
    await page.keyboard.press('Alt+f');
    
    // Verify command bar is still visible after accessibility commands
    await expect(page.locator('#lexia-command-root .lexia-command-modal')).toBeVisible();
  });
});