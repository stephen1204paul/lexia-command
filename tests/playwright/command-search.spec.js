const { test, expect } = require('@playwright/test');

test.describe('Command Bar Search Functionality', () => {
    test.beforeEach(async ({ page }) => {
        // Login to WordPress admin
        await page.goto('/wp-login.php');
        await page.fill('#user_login', 'admin');
        await page.fill('#user_pass', 'password');
        await page.click('#wp-submit');
        
        // Navigate to dashboard
        await page.waitForURL('**/wp-admin/**');
    });

    test('should find and display Customize Theme when searching for "theme"', async ({ page }) => {
        // Open command bar
        await page.keyboard.press('Meta+k'); // Mac
        
        // Wait for command bar to be visible
        await expect(page.locator('.lexia-command-modal')).toBeVisible();
        
        // Type search query
        await page.fill('.lexia-command-input input', 'theme');
        
        // Wait for search results
        await page.waitForTimeout(500); // Allow debounce to complete
        
        // Check that Customize Theme appears in results
        const customizeOption = page.locator('.lexia-command-result:has-text("Customize Theme")');
        await expect(customizeOption).toBeVisible();
        
        // Verify the icon is present
        await expect(customizeOption.locator('.lexia-command-result-icon:has-text("🎨")')).toBeVisible();
    });

    test('should find Customize Theme when searching for partial match "the"', async ({ page }) => {
        // Open command bar
        await page.keyboard.press('Meta+k');
        
        await expect(page.locator('.lexia-command-modal')).toBeVisible();
        
        // Type partial search
        await page.fill('.lexia-command-input input', 'the');
        await page.waitForTimeout(500);
        
        // Should find Customize Theme since "theme" contains "the"
        const customizeOption = page.locator('.lexia-command-result:has-text("Customize Theme")');
        await expect(customizeOption).toBeVisible();
    });

    test('should find Customize Theme when searching for "customize"', async ({ page }) => {
        // Open command bar
        await page.keyboard.press('Meta+k');
        
        await expect(page.locator('.lexia-command-modal')).toBeVisible();
        
        // Search for customize
        await page.fill('.lexia-command-input input', 'customize');
        await page.waitForTimeout(500);
        
        const customizeOption = page.locator('.lexia-command-result:has-text("Customize Theme")');
        await expect(customizeOption).toBeVisible();
    });

    test('should show no results for non-matching search', async ({ page }) => {
        // Open command bar
        await page.keyboard.press('Meta+k');
        
        await expect(page.locator('.lexia-command-modal')).toBeVisible();
        
        // Search for something that doesn't exist
        await page.fill('.lexia-command-input input', 'xyz123nonexistent');
        await page.waitForTimeout(500);
        
        // Should show no results message
        await expect(page.locator('.lexia-command-no-results')).toBeVisible();
        await expect(page.locator('.lexia-command-result')).toHaveCount(0);
    });

    test('should navigate to customizer when Customize Theme is selected', async ({ page }) => {
        // Open command bar
        await page.keyboard.press('Meta+k');
        
        await expect(page.locator('.lexia-command-modal')).toBeVisible();
        
        // Search and click Customize Theme
        await page.fill('.lexia-command-input input', 'theme');
        await page.waitForTimeout(500);
        
        const customizeOption = page.locator('.lexia-command-result:has-text("Customize Theme")');
        await customizeOption.click();
        
        // Should navigate to customizer
        await page.waitForURL('**/wp-admin/customize.php**');
        expect(page.url()).toContain('customize.php');
    });

    test('should filter results in real-time as user types', async ({ page }) => {
        // Open command bar
        await page.keyboard.press('Meta+k');
        await expect(page.locator('.lexia-command-modal')).toBeVisible();
        
        // Type progressively and check filtering
        await page.fill('.lexia-command-input input', 't');
        await page.waitForTimeout(300);
        let results = await page.locator('.lexia-command-result').count();
        const resultsWithT = results;
        
        await page.fill('.lexia-command-input input', 'th');
        await page.waitForTimeout(300);
        results = await page.locator('.lexia-command-result').count();
        const resultsWithTh = results;
        
        await page.fill('.lexia-command-input input', 'theme');
        await page.waitForTimeout(300);
        results = await page.locator('.lexia-command-result').count();
        const resultsWithTheme = results;
        
        // Results should get more specific as we type
        expect(resultsWithTheme).toBeLessThanOrEqual(resultsWithTh);
        expect(resultsWithTh).toBeLessThanOrEqual(resultsWithT);
        
        // Customize Theme should be in final results
        const customizeOption = page.locator('.lexia-command-result:has-text("Customize Theme")');
        await expect(customizeOption).toBeVisible();
    });

    test('should respect user capabilities for theme customization', async ({ page }) => {
        // This test would need a user without customize capabilities
        // For now, we'll test that the option appears for admin
        await page.keyboard.press('Meta+k');
        await expect(page.locator('.lexia-command-modal')).toBeVisible();
        
        await page.fill('.lexia-command-input input', 'customize');
        await page.waitForTimeout(500);
        
        // Admin should see Customize Theme
        const customizeOption = page.locator('.lexia-command-result:has-text("Customize Theme")');
        await expect(customizeOption).toBeVisible();
    });

    test('should handle keyboard navigation in search results', async ({ page }) => {
        // Open command bar
        await page.keyboard.press('Meta+k');
        await expect(page.locator('.lexia-command-modal')).toBeVisible();
        
        // Search for theme
        await page.fill('.lexia-command-input input', 'theme');
        await page.waitForTimeout(500);
        
        // Press down arrow to select first result
        await page.keyboard.press('ArrowDown');
        
        // Check that first result is selected
        const firstResult = page.locator('.lexia-command-result').first();
        await expect(firstResult).toHaveAttribute('data-selected', 'true');
        
        // Press Enter to activate
        await page.keyboard.press('Enter');
        
        // Should navigate away from current page
        await page.waitForTimeout(1000);
        const url = page.url();
        expect(url).not.toContain('wp-admin/index.php');
    });
});

test.describe('Command Bar Visual Regression', () => {
    test('command bar search results should match visual snapshot', async ({ page }) => {
        await page.goto('/wp-login.php');
        await page.fill('#user_login', 'admin');
        await page.fill('#user_pass', 'password');
        await page.click('#wp-submit');
        await page.waitForURL('**/wp-admin/**');
        
        // Open command bar and search
        await page.keyboard.press('Meta+k');
        await expect(page.locator('.lexia-command-modal')).toBeVisible();
        await page.fill('.lexia-command-input input', 'theme');
        await page.waitForTimeout(500);
        
        // Take screenshot of search results
        await expect(page.locator('.lexia-command-modal')).toHaveScreenshot('theme-search-results.png');
    });
});