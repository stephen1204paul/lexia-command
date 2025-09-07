import { searchCommands } from '../../../src/js/commands';
import { commands } from '../../../src/js/commands';
import { COMMAND_TYPES, COMMAND_CATEGORIES } from '../../../src/js/commands/types';
import { 
    setupWordPressGlobals,
    cleanup 
} from '../utils/test-helpers';
import { mockUserCapabilities } from '../fixtures/mock-data';

describe('Command Search Integration', () => {
    beforeEach(() => {
        setupWordPressGlobals();
    });

    afterEach(() => {
        cleanup();
    });

    describe('Search Functionality', () => {
        test('returns empty array when no query provided', () => {
            const results = searchCommands('');
            expect(results).toEqual([]);
            
            const resultsNull = searchCommands(null);
            expect(resultsNull).toEqual([]);
            
            const resultsUndefined = searchCommands(undefined);
            expect(resultsUndefined).toEqual([]);
        });

        test('searches by title (case insensitive)', () => {
            const results = searchCommands('create');
            
            expect(results.length).toBeGreaterThan(0);
            results.forEach(command => {
                const hasCreateInTitle = command.title.toLowerCase().includes('create');
                const hasCreateInKeywords = command.keywords.some(k => 
                    k.toLowerCase().includes('create')
                );
                expect(hasCreateInTitle || hasCreateInKeywords).toBe(true);
            });
        });

        test('searches by keywords (case insensitive)', () => {
            const results = searchCommands('write');
            
            expect(results.length).toBeGreaterThan(0);
            expect(results.some(r => r.id === 'create-post')).toBe(true);
        });

        test('partial keyword matching works', () => {
            const results = searchCommands('plu');
            
            expect(results.length).toBeGreaterThan(0);
            results.forEach(command => {
                const hasPluginInTitle = command.title.toLowerCase().includes('plu');
                const hasPluginInKeywords = command.keywords.some(k => 
                    k.toLowerCase().includes('plu')
                );
                expect(hasPluginInTitle || hasPluginInKeywords).toBe(true);
            });
        });

        test('returns multiple matches when applicable', () => {
            const results = searchCommands('page');
            
            expect(results.length).toBeGreaterThanOrEqual(2);
            expect(results.some(r => r.id === 'create-page')).toBe(true);
            expect(results.some(r => r.id === 'search-pages')).toBe(true);
        });

        test('handles special characters in search query', () => {
            const specialQueries = ['@page', 'page!', 'page#', 'page$'];
            
            specialQueries.forEach(query => {
                expect(() => searchCommands(query)).not.toThrow();
            });
        });

        test('handles very long search queries', () => {
            const longQuery = 'a'.repeat(1000);
            expect(() => searchCommands(longQuery)).not.toThrow();
            
            const results = searchCommands(longQuery);
            expect(Array.isArray(results)).toBe(true);
        });
    });

    describe('User Capability Filtering', () => {
        test('filters plugin commands for users without manage_options', () => {
            setupWordPressGlobals({
                userCaps: {
                    manage_options: false,
                    edit_posts: true,
                }
            });

            const results = searchCommands('plugin');
            expect(results.length).toBe(0);
        });

        test('shows plugin commands for users with manage_options', () => {
            setupWordPressGlobals({
                userCaps: {
                    manage_options: true,
                }
            });

            const results = searchCommands('plugin');
            expect(results.length).toBeGreaterThan(0);
            results.forEach(command => {
                expect(command.category).toBe(COMMAND_CATEGORIES.PLUGINS);
            });
        });

        test('filters settings commands for users without manage_options', () => {
            setupWordPressGlobals({
                userCaps: {
                    manage_options: false,
                    edit_posts: true,
                }
            });

            const results = searchCommands('settings');
            expect(results.every(r => r.category !== COMMAND_CATEGORIES.SETTINGS)).toBe(true);
        });

        test('shows settings commands for users with manage_options', () => {
            setupWordPressGlobals({
                userCaps: {
                    manage_options: true,
                }
            });

            const results = searchCommands('settings');
            expect(results.some(r => r.category === COMMAND_CATEGORIES.SETTINGS)).toBe(true);
        });

        test('content commands are available to editors', () => {
            setupWordPressGlobals({
                userCaps: mockUserCapabilities.editor
            });

            const results = searchCommands('create');
            const contentCommands = results.filter(r => r.category === COMMAND_CATEGORIES.CONTENT);
            expect(contentCommands.length).toBeGreaterThan(0);
        });

        test('respects multiple capability requirements', () => {
            // User with no capabilities
            setupWordPressGlobals({
                userCaps: {
                    manage_options: false,
                    edit_posts: false,
                    edit_pages: false,
                }
            });

            const allResults = searchCommands('');
            expect(allResults).toEqual([]);
        });
    });

    describe('Search Result Quality', () => {
        test('exact matches appear in results', () => {
            const exactSearches = [
                { query: 'Create a new page', expectedId: 'create-page' },
                { query: 'Create a new post', expectedId: 'create-post' },
                { query: 'Manage Plugins', expectedId: 'plugins' },
            ];

            exactSearches.forEach(({ query, expectedId }) => {
                const results = searchCommands(query);
                expect(results.some(r => r.id === expectedId)).toBe(true);
            });
        });

        test('searches are case insensitive', () => {
            const queries = ['CREATE', 'create', 'Create', 'CrEaTe'];
            const resultSets = queries.map(q => searchCommands(q));
            
            // All queries should return the same results
            for (let i = 1; i < resultSets.length; i++) {
                expect(resultSets[i].map(r => r.id).sort()).toEqual(
                    resultSets[0].map(r => r.id).sort()
                );
            }
        });

        test('returns consistent results for same query', () => {
            const query = 'page';
            const results1 = searchCommands(query);
            const results2 = searchCommands(query);
            
            expect(results1.map(r => r.id).sort()).toEqual(
                results2.map(r => r.id).sort()
            );
        });
    });

    describe('Command Categories', () => {
        test('all commands have valid categories', () => {
            const validCategories = Object.values(COMMAND_CATEGORIES);
            
            commands.forEach(command => {
                expect(validCategories).toContain(command.category);
            });
        });

        test('search returns commands from multiple categories', () => {
            setupWordPressGlobals({
                userCaps: {
                    manage_options: true,
                    edit_posts: true,
                    edit_pages: true,
                }
            });

            const results = searchCommands('manage');
            const categories = [...new Set(results.map(r => r.category))];
            
            expect(categories.length).toBeGreaterThan(1);
        });
    });

    describe('Performance', () => {
        test('search completes quickly for common queries', () => {
            const queries = ['page', 'post', 'plugin', 'create', 'search'];
            
            queries.forEach(query => {
                const startTime = performance.now();
                searchCommands(query);
                const endTime = performance.now();
                
                expect(endTime - startTime).toBeLessThan(100); // 100ms threshold
            });
        });

        test('handles empty results efficiently', () => {
            const startTime = performance.now();
            const results = searchCommands('xyznonexistentquery123');
            const endTime = performance.now();
            
            expect(results).toEqual([]);
            expect(endTime - startTime).toBeLessThan(50);
        });
    });

    describe('Edge Cases', () => {
        test('handles undefined window.lexiaCommandData gracefully', () => {
            delete window.lexiaCommandData;
            
            expect(() => searchCommands('test')).not.toThrow();
        });

        test('handles missing userCaps gracefully', () => {
            setupWordPressGlobals({
                userCaps: undefined
            });
            
            expect(() => searchCommands('test')).not.toThrow();
        });

        test('handles whitespace in queries', () => {
            const queries = [
                '  page  ',
                '\tpage\t',
                '\npage\n',
                'page   search',
            ];
            
            queries.forEach(query => {
                const results = searchCommands(query);
                expect(Array.isArray(results)).toBe(true);
            });
        });
    });
});