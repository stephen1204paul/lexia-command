const { test, expect } = require('@playwright/test');
const { CommandBarHelper } = require('./helpers/command-bar');

test.describe('CMDK Filtering Issue Detection', () => {
    let commandBar;

    test.beforeEach(async ({ page }) => {
        // Login to WordPress admin
        await page.goto('/wp-login.php');
        await page.fill('#user_login', 'admin');
        await page.fill('#user_pass', 'password');
        await page.click('#wp-submit');
        await page.waitForURL('**/wp-admin/**');
        
        // Initialize command bar helper
        commandBar = new CommandBarHelper(page);
    });

    test('CRITICAL: Backend and frontend results must match exactly', async ({ page }) => {
        /**
         * This test would have caught the cmdk double-filtering issue.
         * It verifies that what our search function returns is exactly
         * what gets displayed in the UI.
         */
        
        await commandBar.open();
        
        // Test cases that would fail with cmdk filtering enabled
        const testCases = [
            { query: 'the', expectedCommand: 'Customize Theme' },
            { query: 'them', expectedCommand: 'Customize Theme' },
            { query: 'theme', expectedCommand: 'Customize Theme' },
            { query: 'customize', expectedCommand: 'Customize Theme' },
            { query: 'eme', expectedCommand: 'Customize Theme' }, // substring match
        ];
        
        for (const testCase of testCases) {
            // Verify search consistency
            const result = await commandBar.verifySearchConsistency(testCase.query);
            
            expect(result.consistent).toBe(true);
            
            if (!result.consistent) {
                console.error(`Failed for query "${testCase.query}":`, result.message);
                console.error('Displayed:', result.displayed);
                console.error('Backend:', result.backend);
            }
            
            // Also verify the specific command is visible
            const isVisible = await commandBar.isCommandVisible(testCase.expectedCommand);
            expect(isVisible).toBe(true);
        }
    });

    test('All rendered Command.Item elements must be visible', async ({ page }) => {
        /**
         * This test checks that cmdk isn't hiding any Command.Item elements
         * through CSS or aria-hidden attributes.
         */
        
        await commandBar.open();
        await commandBar.search('theme');
        
        // Get all Command.Item elements
        const allItems = await page.locator('[cmdk-item]').all();
        
        for (const item of allItems) {
            // Check visibility
            const isVisible = await item.isVisible();
            expect(isVisible).toBe(true);
            
            // Check for hidden attributes
            const ariaHidden = await item.getAttribute('aria-hidden');
            expect(ariaHidden).not.toBe('true');
            
            // Check CSS display
            const display = await item.evaluate(el => window.getComputedStyle(el).display);
            expect(display).not.toBe('none');
            
            // Check opacity
            const opacity = await item.evaluate(el => window.getComputedStyle(el).opacity);
            expect(parseFloat(opacity)).toBeGreaterThan(0);
        }
    });

    test('Command component should have filtering disabled', async ({ page }) => {
        /**
         * This test verifies that the Command component has the correct
         * configuration to disable built-in filtering.
         */
        
        await commandBar.open();
        
        // Check Command component configuration
        const commandConfig = await page.evaluate(() => {
            const commandEl = document.querySelector('.lexia-command-modal');
            if (!commandEl) return null;
            
            // Check for filter-related attributes
            return {
                hasFilterAttr: commandEl.hasAttribute('data-filter'),
                filterValue: commandEl.getAttribute('data-filter'),
                hasShouldFilterAttr: commandEl.hasAttribute('data-should-filter'),
                shouldFilterValue: commandEl.getAttribute('data-should-filter'),
                // Check React props if accessible
                reactProps: commandEl._reactInternalFiber ? 
                    commandEl._reactInternalFiber.memoizedProps : null
            };
        });
        
        // The component should have filtering disabled
        if (commandConfig) {
            expect(commandConfig.filterValue).not.toBe('true');
            expect(commandConfig.shouldFilterValue).not.toBe('true');
        }
    });

    test('Input value should not affect item visibility directly', async ({ page }) => {
        /**
         * This test ensures that typing in the input doesn't cause
         * cmdk to hide items based on its internal filtering.
         */
        
        await commandBar.open();
        
        // First, get backend results for "theme"
        const backendResults = await commandBar.getBackendSearchResults('theme');
        const customizeThemeInBackend = backendResults.some(r => r.title === 'Customize Theme');
        expect(customizeThemeInBackend).toBe(true);
        
        // Now search and check visibility
        await commandBar.search('theme');
        
        // Count visible vs total results
        const visibleCount = await commandBar.getVisibleResultCount();
        const totalCount = await commandBar.getTotalResultCount();
        
        // All results should be visible (no hidden items)
        expect(visibleCount).toBe(totalCount);
        
        // Specifically check Customize Theme
        const customizeVisible = await commandBar.isCommandVisible('Customize Theme');
        expect(customizeVisible).toBe(true);
    });

    test('Rapid typing should not cause result inconsistency', async ({ page }) => {
        /**
         * This test checks that rapid typing doesn't cause the cmdk
         * filter to interfere with our custom filtering.
         */
        
        await commandBar.open();
        
        const input = page.locator('.lexia-command-input input');
        
        // Type rapidly without waiting
        await input.type('theme', { delay: 50 });
        
        // Wait for final debounce
        await page.waitForTimeout(600);
        
        // Verify consistency
        const result = await commandBar.verifySearchConsistency('theme');
        expect(result.consistent).toBe(true);
        
        // Customize Theme should be visible
        const customizeVisible = await commandBar.isCommandVisible('Customize Theme');
        expect(customizeVisible).toBe(true);
    });

    test('Special characters should not break filtering', async ({ page }) => {
        /**
         * This test ensures that special characters don't cause
         * unexpected behavior in either our filter or cmdk's filter.
         */
        
        await commandBar.open();
        
        const specialQueries = [
            'the[',
            'the]',
            'the(',
            'the)',
            'the*',
            'the.',
            'the\\',
        ];
        
        for (const query of specialQueries) {
            await commandBar.search(query);
            
            // Should not crash or hide the modal
            const isOpen = await commandBar.isOpen();
            expect(isOpen).toBe(true);
            
            // Backend and frontend should still be consistent
            const backendResults = await commandBar.getBackendSearchResults(query);
            const visibleCount = await commandBar.getVisibleResultCount();
            
            // If backend returns results, they should be visible
            if (backendResults.length > 0) {
                expect(visibleCount).toBe(backendResults.length);
            }
        }
    });
});

test.describe('Regression Prevention', () => {
    let commandBar;

    test.beforeEach(async ({ page }) => {
        await page.goto('/wp-login.php');
        await page.fill('#user_login', 'admin');
        await page.fill('#user_pass', 'password');
        await page.click('#wp-submit');
        await page.waitForURL('**/wp-admin/**');
        
        commandBar = new CommandBarHelper(page);
    });

    test('Theme search must always work for substrings', async () => {
        /**
         * This is the exact issue that was reported - searching for "theme"
         * or substrings should always show "Customize Theme"
         */
        
        await commandBar.open();
        
        // All of these should find "Customize Theme"
        const substrings = ['t', 'th', 'the', 'them', 'theme'];
        
        for (const substring of substrings) {
            await commandBar.search(substring);
            
            const backendHasCustomize = (await commandBar.getBackendSearchResults(substring))
                .some(r => r.title === 'Customize Theme');
            
            if (backendHasCustomize) {
                const isVisible = await commandBar.isCommandVisible('Customize Theme');
                expect(isVisible).toBe(true);
            }
        }
    });
});