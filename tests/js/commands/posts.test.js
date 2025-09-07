import { postCommands } from '../../../src/js/commands/posts';
import { COMMAND_TYPES, COMMAND_CATEGORIES } from '../../../src/js/commands/types';
import { 
    setupWordPressGlobals, 
    assertValidCommand,
    cleanup 
} from '../utils/test-helpers';

describe('Post Commands', () => {
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
        test('all post commands have required properties', () => {
            postCommands.forEach(command => {
                assertValidCommand(command);
            });
        });

        test('all post commands belong to CONTENT category', () => {
            postCommands.forEach(command => {
                expect(command.category).toBe(COMMAND_CATEGORIES.CONTENT);
            });
        });

        test('all post commands have unique IDs', () => {
            const ids = postCommands.map(c => c.id);
            const uniqueIds = [...new Set(ids)];
            expect(ids.length).toBe(uniqueIds.length);
        });
    });

    describe('Search Posts Command', () => {
        let searchPostsCommand;

        beforeEach(() => {
            searchPostsCommand = postCommands.find(c => c.id === 'search-posts');
        });

        test('exists and has correct properties', () => {
            expect(searchPostsCommand).toBeDefined();
            expect(searchPostsCommand.type).toBe(COMMAND_TYPES.SEARCH);
            expect(searchPostsCommand.category).toBe(COMMAND_CATEGORIES.CONTENT);
            expect(searchPostsCommand.title).toBe('Search Posts');
        });

        test('dispatches showPostSearch event', () => {
            const closeCommandBar = jest.fn();
            const result = searchPostsCommand.action(closeCommandBar);

            expect(customEventSpy).toHaveBeenCalledWith('lexiaCommand:showPostSearch');
            expect(dispatchEventSpy).toHaveBeenCalled();
            
            const dispatchedEvent = dispatchEventSpy.mock.calls[0][0];
            expect(dispatchedEvent.type).toBe('lexiaCommand:showPostSearch');
        });

        test('prevents command bar from closing', () => {
            const closeCommandBar = jest.fn();
            const result = searchPostsCommand.action(closeCommandBar);
            
            expect(result).toBe(false);
            expect(closeCommandBar).not.toHaveBeenCalled();
        });

        test('has appropriate search keywords', () => {
            expect(searchPostsCommand.keywords).toEqual(
                expect.arrayContaining(['find posts', 'search posts', 'posts', 'find post', 'blog'])
            );
        });

        test('includes blog keyword for better discoverability', () => {
            expect(searchPostsCommand.keywords).toContain('blog');
        });

        test('uses pencil/memo emoji icon', () => {
            expect(searchPostsCommand.icon).toBe('📝');
        });

        test('keyword variations cover common search patterns', () => {
            const keywords = searchPostsCommand.keywords;
            
            // Test singular and plural forms
            expect(keywords.some(k => k.includes('post'))).toBe(true);
            expect(keywords.some(k => k.includes('posts'))).toBe(true);
            
            // Test different action words
            expect(keywords.some(k => k.includes('find'))).toBe(true);
            expect(keywords.some(k => k.includes('search'))).toBe(true);
            
            // Test blog-related keywords
            expect(keywords.some(k => k.includes('blog'))).toBe(true);
        });
    });

    describe('Post Command Event Handling', () => {
        test('event is dispatched on window object', () => {
            const closeCommandBar = jest.fn();
            const searchPostsCommand = postCommands.find(c => c.id === 'search-posts');
            
            searchPostsCommand.action(closeCommandBar);
            
            expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
            expect(dispatchEventSpy.mock.calls[0][0]).toBeInstanceOf(Object);
        });

        test('custom event follows naming convention', () => {
            const closeCommandBar = jest.fn();
            const searchPostsCommand = postCommands.find(c => c.id === 'search-posts');
            
            searchPostsCommand.action(closeCommandBar);
            
            expect(customEventSpy).toHaveBeenCalledWith(
                expect.stringMatching(/^lexiaCommand:/)
            );
        });

        test('event name is specific to post search', () => {
            const closeCommandBar = jest.fn();
            const searchPostsCommand = postCommands.find(c => c.id === 'search-posts');
            
            searchPostsCommand.action(closeCommandBar);
            
            expect(customEventSpy.mock.calls[0][0]).toContain('Post');
        });
    });

    describe('Integration with Command System', () => {
        test('post command integrates with search type', () => {
            const searchPostsCommand = postCommands.find(c => c.id === 'search-posts');
            expect(searchPostsCommand.type).toBe(COMMAND_TYPES.SEARCH);
        });

        test('post command is accessible to users with edit_posts capability', () => {
            // Post commands are in CONTENT category, which should be available
            // to users with edit_posts capability
            const searchPostsCommand = postCommands.find(c => c.id === 'search-posts');
            expect(searchPostsCommand.category).toBe(COMMAND_CATEGORIES.CONTENT);
        });
    });

    describe('Command Behavior Consistency', () => {
        test('all post commands return false to keep command bar open', () => {
            const closeCommandBar = jest.fn();
            
            postCommands.forEach(command => {
                const result = command.action(closeCommandBar);
                expect(result).toBe(false);
            });
            
            expect(closeCommandBar).not.toHaveBeenCalled();
        });

        test('all post commands dispatch custom events', () => {
            const closeCommandBar = jest.fn();
            
            postCommands.forEach(command => {
                dispatchEventSpy.mockClear();
                customEventSpy.mockClear();
                
                command.action(closeCommandBar);
                
                expect(customEventSpy).toHaveBeenCalled();
                expect(dispatchEventSpy).toHaveBeenCalled();
            });
        });
    });

    describe('Post vs Page Command Differentiation', () => {
        test('post command has different icon than page command', () => {
            const searchPostsCommand = postCommands.find(c => c.id === 'search-posts');
            // Note: Page command uses 📄, Post command uses 📝
            expect(searchPostsCommand.icon).toBe('📝');
            expect(searchPostsCommand.icon).not.toBe('📄');
        });

        test('post command dispatches different event than page command', () => {
            const closeCommandBar = jest.fn();
            const searchPostsCommand = postCommands.find(c => c.id === 'search-posts');
            
            searchPostsCommand.action(closeCommandBar);
            
            expect(customEventSpy).toHaveBeenCalledWith('lexiaCommand:showPostSearch');
            expect(customEventSpy).not.toHaveBeenCalledWith('lexiaCommand:showPageSearch');
        });
    });
});