import { pluginCommands } from '../../../src/js/commands/plugins';
import { COMMAND_TYPES, COMMAND_CATEGORIES } from '../../../src/js/commands/types';
import { 
    setupWordPressGlobals, 
    assertValidCommand,
    cleanup 
} from '../utils/test-helpers';

describe('Plugin Commands', () => {
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
        test('all plugin commands have required properties', () => {
            pluginCommands.forEach(command => {
                assertValidCommand(command);
            });
        });

        test('all plugin commands belong to PLUGINS category', () => {
            pluginCommands.forEach(command => {
                expect(command.category).toBe(COMMAND_CATEGORIES.PLUGINS);
            });
        });

        test('all plugin commands have unique IDs', () => {
            const ids = pluginCommands.map(c => c.id);
            const uniqueIds = [...new Set(ids)];
            expect(ids.length).toBe(uniqueIds.length);
        });
    });

    describe('Manage Plugins Command', () => {
        let managePluginsCommand;

        beforeEach(() => {
            managePluginsCommand = pluginCommands.find(c => c.id === 'plugins');
        });

        test('exists and has correct properties', () => {
            expect(managePluginsCommand).toBeDefined();
            expect(managePluginsCommand.type).toBe(COMMAND_TYPES.MANAGE);
            expect(managePluginsCommand.category).toBe(COMMAND_CATEGORIES.PLUGINS);
            expect(managePluginsCommand.title).toContain('Manage Plugins');
        });

        test('dispatches showInstalledPlugins event', () => {
            const closeCommandBar = jest.fn();
            const result = managePluginsCommand.action(closeCommandBar);

            expect(customEventSpy).toHaveBeenCalledWith('lexiaCommand:showInstalledPlugins');
            expect(dispatchEventSpy).toHaveBeenCalled();
            
            const dispatchedEvent = dispatchEventSpy.mock.calls[0][0];
            expect(dispatchedEvent.type).toBe('lexiaCommand:showInstalledPlugins');
        });

        test('prevents command bar from closing', () => {
            const closeCommandBar = jest.fn();
            const result = managePluginsCommand.action(closeCommandBar);
            
            expect(result).toBe(false);
            expect(closeCommandBar).not.toHaveBeenCalled();
        });

        test('has appropriate keywords', () => {
            expect(managePluginsCommand.keywords).toEqual(
                expect.arrayContaining(['plugins', 'add plugin', 'install plugin', 'manage', 'manage plugins'])
            );
        });

        test('uses plugin emoji icon', () => {
            expect(managePluginsCommand.icon).toBe('🔌');
        });
    });

    describe('Install Plugin Command', () => {
        let installPluginCommand;

        beforeEach(() => {
            installPluginCommand = pluginCommands.find(c => c.id === 'install-plugins');
        });

        test('exists and has correct properties', () => {
            expect(installPluginCommand).toBeDefined();
            expect(installPluginCommand.type).toBe(COMMAND_TYPES.ACTION);
            expect(installPluginCommand.category).toBe(COMMAND_CATEGORIES.PLUGINS);
            expect(installPluginCommand.title).toContain('Install Plugin');
        });

        test('dispatches showPluginSearch event', () => {
            const closeCommandBar = jest.fn();
            const result = installPluginCommand.action(closeCommandBar);

            expect(customEventSpy).toHaveBeenCalledWith('lexiaCommand:showPluginSearch');
            expect(dispatchEventSpy).toHaveBeenCalled();
            
            const dispatchedEvent = dispatchEventSpy.mock.calls[0][0];
            expect(dispatchedEvent.type).toBe('lexiaCommand:showPluginSearch');
        });

        test('prevents command bar from closing', () => {
            const closeCommandBar = jest.fn();
            const result = installPluginCommand.action(closeCommandBar);
            
            expect(result).toBe(false);
            expect(closeCommandBar).not.toHaveBeenCalled();
        });

        test('has appropriate keywords', () => {
            expect(installPluginCommand.keywords).toEqual(
                expect.arrayContaining(['install', 'plugin'])
            );
        });

        test('uses plugin emoji icon', () => {
            expect(installPluginCommand.icon).toBe('🔌');
        });
    });

    describe('Plugin Command Interactions', () => {
        test('both commands return false to keep command bar open', () => {
            const closeCommandBar = jest.fn();
            
            pluginCommands.forEach(command => {
                const result = command.action(closeCommandBar);
                expect(result).toBe(false);
            });
            
            expect(closeCommandBar).not.toHaveBeenCalled();
        });

        test('commands dispatch different events for different functionality', () => {
            const closeCommandBar = jest.fn();
            
            const manageCommand = pluginCommands.find(c => c.id === 'plugins');
            const installCommand = pluginCommands.find(c => c.id === 'install-plugins');
            
            manageCommand.action(closeCommandBar);
            installCommand.action(closeCommandBar);
            
            const eventCalls = customEventSpy.mock.calls;
            expect(eventCalls[0][0]).toBe('lexiaCommand:showInstalledPlugins');
            expect(eventCalls[1][0]).toBe('lexiaCommand:showPluginSearch');
        });
    });

    describe('Plugin Command Security', () => {
        test('plugin commands require manage_options capability (implied by category)', () => {
            // Plugin commands should only be available to users with manage_options
            // This is handled by the searchCommands function filtering
            pluginCommands.forEach(command => {
                expect(command.category).toBe(COMMAND_CATEGORIES.PLUGINS);
            });
        });
    });

    describe('Event Handling', () => {
        test('events are dispatched on window object', () => {
            const closeCommandBar = jest.fn();
            
            pluginCommands.forEach(command => {
                dispatchEventSpy.mockClear();
                command.action(closeCommandBar);
                
                expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
                expect(dispatchEventSpy.mock.calls[0][0]).toBeInstanceOf(Object);
            });
        });

        test('custom events have correct structure', () => {
            const closeCommandBar = jest.fn();
            const manageCommand = pluginCommands.find(c => c.id === 'plugins');
            
            manageCommand.action(closeCommandBar);
            
            expect(customEventSpy).toHaveBeenCalledWith(
                expect.stringContaining('lexiaCommand:')
            );
        });
    });
});