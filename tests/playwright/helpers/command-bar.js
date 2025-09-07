/**
 * Helper functions for testing the Lexia Command Bar
 */

class CommandBarHelper {
    constructor(page) {
        this.page = page;
    }

    /**
     * Open the command bar using keyboard shortcut
     */
    async open() {
        const isMac = await this.page.evaluate(() => navigator.platform.includes('Mac'));
        const modifier = isMac ? 'Meta' : 'Control';
        await this.page.keyboard.press(`${modifier}+k`);
        await this.page.waitForSelector('.lexia-command-modal', { state: 'visible' });
    }

    /**
     * Close the command bar
     */
    async close() {
        await this.page.keyboard.press('Escape');
        await this.page.waitForSelector('.lexia-command-modal', { state: 'hidden' });
    }

    /**
     * Search for a query in the command bar
     */
    async search(query) {
        const input = this.page.locator('.lexia-command-input input');
        await input.fill(query);
        // Wait for debounce
        await this.page.waitForTimeout(500);
    }

    /**
     * Get all visible search results
     */
    async getVisibleResults() {
        const results = await this.page.locator('.lexia-command-result:visible').all();
        return Promise.all(results.map(async (result) => {
            const title = await result.locator('.lexia-command-result-title').textContent();
            const icon = await result.locator('.lexia-command-result-icon').textContent();
            return { title, icon };
        }));
    }

    /**
     * Check if a specific command is visible
     */
    async isCommandVisible(commandTitle) {
        const command = this.page.locator(`.lexia-command-result:has-text("${commandTitle}")`);
        return command.isVisible();
    }

    /**
     * Select a command by title
     */
    async selectCommand(commandTitle) {
        const command = this.page.locator(`.lexia-command-result:has-text("${commandTitle}")`);
        await command.click();
    }

    /**
     * Get the currently selected command index
     */
    async getSelectedIndex() {
        const results = await this.page.locator('.lexia-command-result').all();
        for (let i = 0; i < results.length; i++) {
            const isSelected = await results[i].getAttribute('data-selected');
            if (isSelected === 'true') {
                return i;
            }
        }
        return -1;
    }

    /**
     * Navigate results using keyboard
     */
    async navigateDown() {
        await this.page.keyboard.press('ArrowDown');
    }

    async navigateUp() {
        await this.page.keyboard.press('ArrowUp');
    }

    async selectCurrent() {
        await this.page.keyboard.press('Enter');
    }

    /**
     * Check if command bar is open
     */
    async isOpen() {
        return this.page.locator('.lexia-command-modal').isVisible();
    }

    /**
     * Get the count of all results (visible and hidden)
     */
    async getTotalResultCount() {
        return this.page.locator('.lexia-command-result').count();
    }

    /**
     * Get the count of visible results
     */
    async getVisibleResultCount() {
        return this.page.locator('.lexia-command-result:visible').count();
    }

    /**
     * Execute the search function directly in the browser
     */
    async getBackendSearchResults(query) {
        return this.page.evaluate((searchQuery) => {
            if (window.LexiaCommand && window.LexiaCommand.searchCommands) {
                return window.LexiaCommand.searchCommands(searchQuery).map(r => ({
                    id: r.id,
                    title: r.title,
                    icon: r.icon
                }));
            }
            return [];
        }, query);
    }

    /**
     * Compare frontend display with backend results
     */
    async verifySearchConsistency(query) {
        await this.search(query);
        
        const displayedResults = await this.getVisibleResults();
        const backendResults = await this.getBackendSearchResults(query);
        
        // Check if counts match
        if (displayedResults.length !== backendResults.length) {
            return {
                consistent: false,
                message: `Count mismatch: displayed ${displayedResults.length}, backend ${backendResults.length}`,
                displayed: displayedResults,
                backend: backendResults
            };
        }
        
        // Check if all backend results are displayed
        for (const backendResult of backendResults) {
            const found = displayedResults.some(d => d.title === backendResult.title);
            if (!found) {
                return {
                    consistent: false,
                    message: `Backend result "${backendResult.title}" not displayed`,
                    displayed: displayedResults,
                    backend: backendResults
                };
            }
        }
        
        return {
            consistent: true,
            message: 'Frontend and backend results match',
            displayed: displayedResults,
            backend: backendResults
        };
    }
}

module.exports = { CommandBarHelper };