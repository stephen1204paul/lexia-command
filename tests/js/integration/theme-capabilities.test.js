import { searchCommands } from '../../../src/js/commands';
import { 
    setupWordPressGlobals,
    cleanup 
} from '../utils/test-helpers';

describe('Theme Capability Integration', () => {
    afterEach(() => {
        cleanup();
    });

    test('theme customization is accessible with theme-specific capabilities', () => {
        // Test various capability combinations
        const capabilityTests = [
            {
                name: 'admin with manage_options',
                caps: { manage_options: true },
                shouldHaveAccess: true
            },
            {
                name: 'user with customize capability',
                caps: { manage_options: false, customize: true },
                shouldHaveAccess: true
            },
            {
                name: 'user with edit_theme_options capability',
                caps: { manage_options: false, edit_theme_options: true },
                shouldHaveAccess: true
            },
            {
                name: 'user with both theme capabilities',
                caps: { manage_options: false, customize: true, edit_theme_options: true },
                shouldHaveAccess: true
            },
            {
                name: 'editor without theme capabilities',
                caps: { manage_options: false, edit_posts: true, edit_pages: true },
                shouldHaveAccess: false
            },
            {
                name: 'user with no relevant capabilities',
                caps: { some_other_cap: true },
                shouldHaveAccess: false
            }
        ];

        capabilityTests.forEach(({ name, caps, shouldHaveAccess }) => {
            setupWordPressGlobals({ userCaps: caps });
            
            const results = searchCommands('theme');
            const customizeCommand = results.find(r => r.id === 'customize');
            
            if (shouldHaveAccess) {
                expect(customizeCommand).toBeDefined();
                console.log(`✅ ${name}: Can access theme customization`);
            } else {
                expect(customizeCommand).toBeUndefined();
                console.log(`✅ ${name}: Correctly denied theme customization access`);
            }
        });
    });

    test('enhanced keywords improve discoverability', () => {
        setupWordPressGlobals({
            userCaps: { customize: true }
        });

        const keywordTests = [
            'theme', 'themes', 'customize', 'customizer', 
            'design', 'style', 'appearance'
        ];

        keywordTests.forEach(keyword => {
            const results = searchCommands(keyword);
            const customizeCommand = results.find(r => r.id === 'customize');
            
            expect(customizeCommand).toBeDefined();
            expect(customizeCommand.keywords).toContain(keyword);
        });
    });

    test('other settings commands still require manage_options', () => {
        setupWordPressGlobals({
            userCaps: { 
                customize: true,
                edit_theme_options: true,
                manage_options: false 
            }
        });

        // Test that theme customization works
        const themeResults = searchCommands('customize');
        const customizeCommand = themeResults.find(r => r.id === 'customize');
        expect(customizeCommand).toBeDefined();
        
        // Test that other settings commands are blocked
        const settingsResults = searchCommands('settings');
        const settingsCommand = settingsResults.find(r => r.id === 'settings');
        expect(settingsCommand).toBeUndefined();
    });

    test('mixed capability scenarios work correctly', () => {
        // Test a realistic scenario: user who can customize themes but not manage all options
        setupWordPressGlobals({
            userCaps: {
                edit_posts: true,
                edit_pages: true,
                upload_files: true,
                customize: true,
                manage_options: false
            }
        });

        // Should be able to customize theme
        const themeResults = searchCommands('theme');
        const customizeCommand = themeResults.find(r => r.id === 'customize');
        expect(customizeCommand).toBeDefined();

        // Should not be able to access plugins
        const pluginResults = searchCommands('plugin');
        expect(pluginResults.length).toBe(0);

        // Should not be able to access general settings
        const settingsResults = searchCommands('site settings');
        const generalSettings = settingsResults.find(r => r.id === 'settings');
        expect(generalSettings).toBeUndefined();
    });
});