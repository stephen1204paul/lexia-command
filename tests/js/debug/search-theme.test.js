import { searchCommands } from '../../../src/js/commands';
import { coreCommands } from '../../../src/js/commands/core';
import { COMMAND_CATEGORIES } from '../../../src/js/commands/types';
import { 
    setupWordPressGlobals,
    cleanup 
} from '../utils/test-helpers';

describe('Search Debug: Theme Command', () => {
    beforeEach(() => {
        setupWordPressGlobals({
            userCaps: {
                manage_options: true,
                edit_posts: true,
                edit_pages: true,
            }
        });
    });

    afterEach(() => {
        cleanup();
    });

    test('Customize Theme command exists and has correct properties', () => {
        const customizeCommand = coreCommands.find(c => c.id === 'customize');
        
        expect(customizeCommand).toBeDefined();
        expect(customizeCommand.title).toContain('Customize Theme');
        expect(customizeCommand.keywords).toContain('theme');
        expect(customizeCommand.category).toBe(COMMAND_CATEGORIES.SETTINGS);
        
        console.log('Customize Theme Command:', {
            id: customizeCommand.id,
            title: customizeCommand.title,
            keywords: customizeCommand.keywords,
            category: customizeCommand.category
        });
    });

    test('search for "theme" should return Customize Theme command', () => {
        const results = searchCommands('theme');
        
        console.log(`Search results for "theme": ${results.length} results`);
        results.forEach((result, index) => {
            console.log(`${index + 1}. ${result.title} (ID: ${result.id}, Category: ${result.category})`);
        });
        
        const customizeResult = results.find(r => r.id === 'customize');
        expect(customizeResult).toBeDefined();
        expect(customizeResult.title).toContain('Customize Theme');
    });

    test('search works with different user capabilities', () => {
        // Test with manage_options = true
        setupWordPressGlobals({
            userCaps: {
                manage_options: true,
            }
        });

        const resultsWithPermission = searchCommands('theme');
        const customizeWithPermission = resultsWithPermission.find(r => r.id === 'customize');
        expect(customizeWithPermission).toBeDefined();

        // Test with manage_options = false
        setupWordPressGlobals({
            userCaps: {
                manage_options: false,
            }
        });

        const resultsWithoutPermission = searchCommands('theme');
        const customizeWithoutPermission = resultsWithoutPermission.find(r => r.id === 'customize');
        
        console.log('Results with manage_options=false:', resultsWithoutPermission.length);
        console.log('Found customize command without permission:', !!customizeWithoutPermission);
        
        expect(customizeWithoutPermission).toBeUndefined();
    });

    test('search for other related terms', () => {
        const searchTerms = ['customize', 'appearance', 'customiz'];
        
        searchTerms.forEach(term => {
            const results = searchCommands(term);
            const customizeResult = results.find(r => r.id === 'customize');
            
            console.log(`Search "${term}": ${results.length} results, customize found: ${!!customizeResult}`);
            
            if (term === 'customize' || term === 'appearance') {
                expect(customizeResult).toBeDefined();
            }
        });
    });
});