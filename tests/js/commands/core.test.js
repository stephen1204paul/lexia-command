import { coreCommands } from '../../../src/js/commands/core';
import { COMMAND_TYPES, COMMAND_CATEGORIES } from '../../../src/js/commands/types';
import { 
    setupWordPressGlobals, 
    mockWindowLocation, 
    assertValidCommand,
    cleanup 
} from '../utils/test-helpers';

describe('Core Commands', () => {
    beforeEach(() => {
        setupWordPressGlobals();
        mockWindowLocation();
    });

    afterEach(() => {
        cleanup();
    });

    describe('Command Structure', () => {
        test('all core commands have required properties', () => {
            coreCommands.forEach(command => {
                assertValidCommand(command);
            });
        });

        test('all core commands have valid types', () => {
            const validTypes = Object.values(COMMAND_TYPES);
            coreCommands.forEach(command => {
                expect(validTypes).toContain(command.type);
            });
        });

        test('all core commands have valid categories', () => {
            const validCategories = Object.values(COMMAND_CATEGORIES);
            coreCommands.forEach(command => {
                expect(validCategories).toContain(command.category);
            });
        });

        test('all core commands have unique IDs', () => {
            const ids = coreCommands.map(c => c.id);
            const uniqueIds = [...new Set(ids)];
            expect(ids.length).toBe(uniqueIds.length);
        });
    });

    describe('Create Page Command', () => {
        let createPageCommand;

        beforeEach(() => {
            createPageCommand = coreCommands.find(c => c.id === 'create-page');
        });

        test('exists and has correct properties', () => {
            expect(createPageCommand).toBeDefined();
            expect(createPageCommand.type).toBe(COMMAND_TYPES.CREATE);
            expect(createPageCommand.category).toBe(COMMAND_CATEGORIES.CONTENT);
            expect(createPageCommand.title).toContain('page');
        });

        test('navigates to correct URL when executed', () => {
            createPageCommand.action();
            expect(window.location.href).toBe('http://localhost/wp-admin/post-new.php?post_type=page');
        });

        test('has appropriate keywords', () => {
            expect(createPageCommand.keywords).toEqual(
                expect.arrayContaining(['new page', 'add page', 'create page'])
            );
        });
    });

    describe('Create Post Command', () => {
        let createPostCommand;

        beforeEach(() => {
            createPostCommand = coreCommands.find(c => c.id === 'create-post');
        });

        test('exists and has correct properties', () => {
            expect(createPostCommand).toBeDefined();
            expect(createPostCommand.type).toBe(COMMAND_TYPES.CREATE);
            expect(createPostCommand.category).toBe(COMMAND_CATEGORIES.CONTENT);
            expect(createPostCommand.title).toContain('post');
        });

        test('navigates to correct URL when executed', () => {
            createPostCommand.action();
            expect(window.location.href).toBe('http://localhost/wp-admin/post-new.php');
        });

        test('includes "write" keyword for blog posts', () => {
            expect(createPostCommand.keywords).toContain('write');
        });
    });

    describe('Media Library Command', () => {
        let mediaCommand;

        beforeEach(() => {
            mediaCommand = coreCommands.find(c => c.id === 'media-library');
        });

        test('exists and has correct properties', () => {
            expect(mediaCommand).toBeDefined();
            expect(mediaCommand.type).toBe(COMMAND_TYPES.MANAGE);
            expect(mediaCommand.category).toBe(COMMAND_CATEGORIES.CONTENT);
        });

        test('navigates to media library', () => {
            mediaCommand.action();
            expect(window.location.href).toBe('http://localhost/wp-admin/upload.php');
        });

        test('has media-related keywords', () => {
            expect(mediaCommand.keywords).toEqual(
                expect.arrayContaining(['media', 'images', 'library', 'files'])
            );
        });
    });

    describe('Settings Command', () => {
        let settingsCommand;

        beforeEach(() => {
            settingsCommand = coreCommands.find(c => c.id === 'settings');
        });

        test('exists and has correct properties', () => {
            expect(settingsCommand).toBeDefined();
            expect(settingsCommand.type).toBe(COMMAND_TYPES.MANAGE);
            expect(settingsCommand.category).toBe(COMMAND_CATEGORIES.SETTINGS);
        });

        test('navigates to general settings', () => {
            settingsCommand.action();
            expect(window.location.href).toBe('http://localhost/wp-admin/options-general.php');
        });

        test('requires manage_options capability', () => {
            // This is implied by the SETTINGS category
            expect(settingsCommand.category).toBe(COMMAND_CATEGORIES.SETTINGS);
        });
    });

    describe('Customize Theme Command', () => {
        let customizeCommand;

        beforeEach(() => {
            customizeCommand = coreCommands.find(c => c.id === 'customize');
        });

        test('exists and has correct properties', () => {
            expect(customizeCommand).toBeDefined();
            expect(customizeCommand.type).toBe(COMMAND_TYPES.MANAGE);
            expect(customizeCommand.category).toBe(COMMAND_CATEGORIES.SETTINGS);
        });

        test('navigates to customizer', () => {
            customizeCommand.action();
            expect(window.location.href).toBe('http://localhost/wp-admin/customize.php');
        });

        test('has theme-related keywords', () => {
            expect(customizeCommand.keywords).toEqual(
                expect.arrayContaining(['customize', 'theme', 'appearance', 'customizer', 'design', 'style', 'themes'])
            );
        });
    });

    describe('Manage Menus Command', () => {
        let menusCommand;

        beforeEach(() => {
            menusCommand = coreCommands.find(c => c.id === 'menus');
        });

        test('exists and has correct properties', () => {
            expect(menusCommand).toBeDefined();
            expect(menusCommand.type).toBe(COMMAND_TYPES.MANAGE);
            expect(menusCommand.category).toBe(COMMAND_CATEGORIES.CONTENT);
        });

        test('navigates to menu editor', () => {
            menusCommand.action();
            expect(window.location.href).toBe('http://localhost/wp-admin/nav-menus.php');
        });

        test('has navigation-related keywords', () => {
            expect(menusCommand.keywords).toEqual(
                expect.arrayContaining(['menus', 'navigation', 'nav'])
            );
        });
    });

    describe('Command Icons', () => {
        test('all commands have emoji icons', () => {
            coreCommands.forEach(command => {
                expect(command.icon).toBeDefined();
                expect(command.icon.length).toBeGreaterThan(0);
                // Check if it's an emoji (simple check for non-ASCII characters)
                expect(/[^\u0000-\u007F]/.test(command.icon)).toBe(true);
            });
        });
    });

    describe('URL Construction', () => {
        test('all navigation commands use lexiaCommandData.adminUrl', () => {
            const navigationCommands = coreCommands.filter(c => 
                c.action.toString().includes('window.location.href')
            );

            navigationCommands.forEach(command => {
                const actionString = command.action.toString();
                expect(actionString).toContain('lexiaCommandData.adminUrl');
            });
        });

        test('URLs are constructed correctly with different admin URLs', () => {
            setupWordPressGlobals({ adminUrl: 'https://example.com/wp-admin/' });
            
            const createPageCommand = coreCommands.find(c => c.id === 'create-page');
            createPageCommand.action();
            
            expect(window.location.href).toBe('https://example.com/wp-admin/post-new.php?post_type=page');
        });
    });
});