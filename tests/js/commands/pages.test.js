import { pageCommands } from '../../../src/js/commands/pages';
import { COMMAND_TYPES, COMMAND_CATEGORIES } from '../../../src/js/commands/types';
import { 
    setupWordPressGlobals, 
    assertValidCommand,
    cleanup 
} from '../utils/test-helpers';

describe('Page Commands', () => {
    let dispatchEventSpy;
    let customEventSpy;

    beforeEach(() => {
        setupWordPressGlobals();
        
        // Mock window.dispatchEvent and CustomEvent
        dispatchEventSpy = jest.spyOn(window, 'dispatchEvent').mockImplementation(() => true);
        customEventSpy = jest.fn().mockImplementation((eventName, options) => ({
            type: eventName,
            bubbles: false,
            cancelable: false,
            detail: options?.detail || null,
            ...options
        }));
        global.CustomEvent = customEventSpy;
        window.CustomEvent = customEventSpy;
    });

    afterEach(() => {
        dispatchEventSpy.mockRestore();
        cleanup();
    });

    describe('Command Structure', () => {
        test('all page commands have required properties', () => {
            pageCommands.forEach(command => {
                assertValidCommand(command);
            });
        });

        test('all page commands belong to CONTENT category', () => {
            pageCommands.forEach(command => {
                expect(command.category).toBe(COMMAND_CATEGORIES.CONTENT);
            });
        });

        test('all page commands have unique IDs', () => {
            const ids = pageCommands.map(c => c.id);
            const uniqueIds = [...new Set(ids)];
            expect(ids.length).toBe(uniqueIds.length);
        });
    });

    describe('Search Pages Command', () => {
        let searchPagesCommand;

        beforeEach(() => {
            searchPagesCommand = pageCommands.find(c => c.id === 'search-pages');
        });

        test('exists and has correct properties', () => {
            expect(searchPagesCommand).toBeDefined();
            expect(searchPagesCommand.type).toBe(COMMAND_TYPES.SEARCH);
            expect(searchPagesCommand.category).toBe(COMMAND_CATEGORIES.CONTENT);
            expect(searchPagesCommand.title).toBe('Search Pages');
        });

        test('dispatches showPageSearch event', () => {
            const closeCommandBar = jest.fn();
            const result = searchPagesCommand.action(closeCommandBar);

            expect(customEventSpy).toHaveBeenCalledWith('lexiaCommand:showPageSearch');
            expect(dispatchEventSpy).toHaveBeenCalled();
            
            const dispatchedEvent = dispatchEventSpy.mock.calls[0][0];
            expect(dispatchedEvent.type).toBe('lexiaCommand:showPageSearch');
        });

        test('prevents command bar from closing', () => {
            const closeCommandBar = jest.fn();
            const result = searchPagesCommand.action(closeCommandBar);
            
            expect(result).toBe(false);
            expect(closeCommandBar).not.toHaveBeenCalled();
        });

        test('has appropriate search keywords', () => {
            expect(searchPagesCommand.keywords).toEqual(
                expect.arrayContaining(['find pages', 'search pages', 'pages', 'find page'])
            );
        });

        test('uses page emoji icon', () => {
            expect(searchPagesCommand.icon).toBe('📄');
        });

        test('keyword variations cover common search patterns', () => {
            const keywords = searchPagesCommand.keywords;
            
            // Test singular and plural forms
            expect(keywords.some(k => k.includes('page'))).toBe(true);
            expect(keywords.some(k => k.includes('pages'))).toBe(true);
            
            // Test different action words
            expect(keywords.some(k => k.includes('find'))).toBe(true);
            expect(keywords.some(k => k.includes('search'))).toBe(true);
        });
    });

    describe('Page Command Event Handling', () => {
        test('event is dispatched on window object', () => {
            const closeCommandBar = jest.fn();
            const searchPagesCommand = pageCommands.find(c => c.id === 'search-pages');
            
            searchPagesCommand.action(closeCommandBar);
            
            expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
            expect(dispatchEventSpy.mock.calls[0][0]).toBeInstanceOf(Object);
        });

        test('custom event follows naming convention', () => {
            const closeCommandBar = jest.fn();
            const searchPagesCommand = pageCommands.find(c => c.id === 'search-pages');
            
            searchPagesCommand.action(closeCommandBar);
            
            expect(customEventSpy).toHaveBeenCalledWith(
                expect.stringMatching(/^lexiaCommand:/)
            );
        });

        test('event name is specific to page search', () => {
            const closeCommandBar = jest.fn();
            const searchPagesCommand = pageCommands.find(c => c.id === 'search-pages');
            
            searchPagesCommand.action(closeCommandBar);
            
            expect(customEventSpy.mock.calls[0][0]).toContain('Page');
        });
    });

    describe('Integration with Command System', () => {
        test('page command integrates with search type', () => {
            const searchPagesCommand = pageCommands.find(c => c.id === 'search-pages');
            expect(searchPagesCommand.type).toBe(COMMAND_TYPES.SEARCH);
        });

        test('page command is accessible to users with edit_pages capability', () => {
            // Page commands are in CONTENT category, which should be available
            // to users with edit_pages capability
            const searchPagesCommand = pageCommands.find(c => c.id === 'search-pages');
            expect(searchPagesCommand.category).toBe(COMMAND_CATEGORIES.CONTENT);
        });
    });

    describe('Command Behavior Consistency', () => {
        test('all page commands return false to keep command bar open', () => {
            const closeCommandBar = jest.fn();
            
            pageCommands.forEach(command => {
                const result = command.action(closeCommandBar);
                expect(result).toBe(false);
            });
            
            expect(closeCommandBar).not.toHaveBeenCalled();
        });

        test('all page commands dispatch custom events', () => {
            const closeCommandBar = jest.fn();
            
            pageCommands.forEach(command => {
                dispatchEventSpy.mockClear();
                customEventSpy.mockClear();
                
                command.action(closeCommandBar);
                
                expect(customEventSpy).toHaveBeenCalled();
                expect(dispatchEventSpy).toHaveBeenCalled();
            });
        });
    });
});