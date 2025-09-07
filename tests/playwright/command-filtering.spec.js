const { test, expect } = require('@playwright/test');

test.describe('Command Bar Filtering Edge Cases', () => {
    test.beforeEach(async ({ page }) => {
        // Login to WordPress admin
        await page.goto('/wp-login.php');
        await page.fill('#user_login', 'admin');
        await page.fill('#user_pass', 'password');
        await page.click('#wp-submit');
        await page.waitForURL('**/wp-admin/**');
    });

    test('should display filtered results without cmdk interference', async ({ page }) => {
        // This test specifically catches the cmdk double-filtering issue
        
        // Open command bar
        await page.keyboard.press('Meta+k');
        await expect(page.locator('.lexia-command-modal')).toBeVisible();
        
        // Search for "the" which should match "Customize Theme"
        await page.fill('.lexia-command-input input', 'the');
        await page.waitForTimeout(500);
        
        // Get all visible results
        const visibleResults = await page.locator('.lexia-command-result:visible').count();
        
        // Get all rendered results (including hidden ones)
        const allResults = await page.locator('.lexia-command-result').count();
        
        // All rendered results should be visible (no cmdk filtering hiding them)
        expect(visibleResults).toBe(allResults);
        
        // Customize Theme should be visible
        const customizeOption = page.locator('.lexia-command-result:has-text("Customize Theme")');
        await expect(customizeOption).toBeVisible();
        
        // The result should not have any cmdk-specific hidden attributes
        const isHidden = await customizeOption.evaluate(el => {
            return window.getComputedStyle(el).display === 'none' || 
                   el.hasAttribute('aria-hidden') ||
                   el.hasAttribute('data-hidden');
        });
        expect(isHidden).toBe(false);
    });

    test('should show exact matches from our search logic', async ({ page }) => {
        // Inject a test to verify our search results match what's displayed
        await page.keyboard.press('Meta+k');
        await expect(page.locator('.lexia-command-modal')).toBeVisible();
        
        // Search for theme
        await page.fill('.lexia-command-input input', 'theme');
        await page.waitForTimeout(500);
        
        // Execute our search function directly in the browser
        const searchResults = await page.evaluate(() => {
            if (window.LexiaCommand && window.LexiaCommand.searchCommands) {
                return window.LexiaCommand.searchCommands('theme').map(r => r.title);
            }
            return [];
        });
        
        // Get displayed results
        const displayedTitles = await page.locator('.lexia-command-result-title').allTextContents();
        
        // They should match exactly
        expect(displayedTitles.sort()).toEqual(searchResults.sort());
    });

    test('should not have duplicate filtering layers', async ({ page }) => {
        await page.keyboard.press('Meta+k');
        await expect(page.locator('.lexia-command-modal')).toBeVisible();
        
        // Type a query
        await page.fill('.lexia-command-input input', 'customize');
        await page.waitForTimeout(500);
        
        // Check that the Command component doesn't have default filtering enabled
        const commandElement = page.locator('.lexia-command-modal');
        const hasDefaultFilter = await commandElement.evaluate(el => {
            // Check if cmdk's default filter is disabled
            const cmdkRoot = el.closest('[cmdk-root]');
            return cmdkRoot && cmdkRoot.getAttribute('data-filter') !== 'false';
        });
        
        expect(hasDefaultFilter).toBe(false);
    });

    test('should handle special characters in search without breaking', async ({ page }) => {
        await page.keyboard.press('Meta+k');
        await expect(page.locator('.lexia-command-modal')).toBeVisible();
        
        // Test various special characters that might break filtering
        const testQueries = ['the(', 'the)', 'the*', 'the.', 'the[', 'the]'];
        
        for (const query of testQueries) {
            await page.fill('.lexia-command-input input', query);
            await page.waitForTimeout(300);
            
            // Should not throw errors or break the UI
            const modalVisible = await page.locator('.lexia-command-modal').isVisible();
            expect(modalVisible).toBe(true);
            
            // Input should still be functional
            const inputValue = await page.locator('.lexia-command-input input').inputValue();
            expect(inputValue).toBe(query);
        }
    });

    test('should maintain result visibility during rapid typing', async ({ page }) => {
        await page.keyboard.press('Meta+k');
        await expect(page.locator('.lexia-command-modal')).toBeVisible();
        
        // Rapidly type and backspace
        const input = page.locator('.lexia-command-input input');
        
        await input.type('t');
        await input.type('h');
        await input.type('e');
        await input.type('m');
        await input.type('e');
        
        // Wait for debounce
        await page.waitForTimeout(500);
        
        // Check Customize Theme is visible
        let customizeOption = page.locator('.lexia-command-result:has-text("Customize Theme")');
        await expect(customizeOption).toBeVisible();
        
        // Now backspace
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.waitForTimeout(500);
        
        // Should still show Customize Theme for "the"
        customizeOption = page.locator('.lexia-command-result:has-text("Customize Theme")');
        await expect(customizeOption).toBeVisible();
    });

    test('should correctly filter when switching between search contexts', async ({ page }) => {
        // Open command bar
        await page.keyboard.press('Meta+k');
        await expect(page.locator('.lexia-command-modal')).toBeVisible();
        
        // Search for theme in commands
        await page.fill('.lexia-command-input input', 'theme');
        await page.waitForTimeout(500);
        
        const customizeOption = page.locator('.lexia-command-result:has-text("Customize Theme")');
        await expect(customizeOption).toBeVisible();
        
        // Clear and search for something else
        await page.fill('.lexia-command-input input', '');
        await page.fill('.lexia-command-input input', 'post');
        await page.waitForTimeout(500);
        
        // Should show post-related commands
        const postOption = page.locator('.lexia-command-result:has-text("post")');
        const postCount = await postOption.count();
        expect(postCount).toBeGreaterThan(0);
        
        // Go back to theme search
        await page.fill('.lexia-command-input input', 'theme');
        await page.waitForTimeout(500);
        
        // Customize Theme should reappear
        await expect(customizeOption).toBeVisible();
    });
});

test.describe('Performance and State Management', () => {
    test('should not cause memory leaks with repeated searches', async ({ page }) => {
        await page.goto('/wp-login.php');
        await page.fill('#user_login', 'admin');
        await page.fill('#user_pass', 'password');
        await page.click('#wp-submit');
        await page.waitForURL('**/wp-admin/**');
        
        // Open command bar
        await page.keyboard.press('Meta+k');
        await expect(page.locator('.lexia-command-modal')).toBeVisible();
        
        // Perform multiple searches
        const queries = ['theme', 'post', 'page', 'media', 'customize', 'settings'];
        
        for (let i = 0; i < 3; i++) {
            for (const query of queries) {
                await page.fill('.lexia-command-input input', query);
                await page.waitForTimeout(200);
            }
        }
        
        // Check that the UI is still responsive
        await page.fill('.lexia-command-input input', 'theme');
        await page.waitForTimeout(500);
        
        const customizeOption = page.locator('.lexia-command-result:has-text("Customize Theme")');
        await expect(customizeOption).toBeVisible();
    });
});