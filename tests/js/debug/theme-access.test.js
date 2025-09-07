import { searchCommands } from '../../../src/js/commands';
import { 
    setupWordPressGlobals,
    cleanup 
} from '../utils/test-helpers';

describe('Theme Access Improvements', () => {
    afterEach(() => {
        cleanup();
    });

    test('Customize Theme appears for admin users', () => {
        setupWordPressGlobals({
            userCaps: {
                manage_options: true,
            }
        });

        const results = searchCommands('theme');
        const customizeCommand = results.find(r => r.id === 'customize');
        
        expect(customizeCommand).toBeDefined();
        expect(customizeCommand.title).toContain('Customize Theme');
        
        console.log('✅ Admin can access Customize Theme');
    });

    test('Customize Theme appears for users with customize capability', () => {
        setupWordPressGlobals({
            userCaps: {
                manage_options: false,
                customize: true,
            }
        });

        const results = searchCommands('theme');
        const customizeCommand = results.find(r => r.id === 'customize');
        
        expect(customizeCommand).toBeDefined();
        expect(customizeCommand.title).toContain('Customize Theme');
        
        console.log('✅ User with customize capability can access Customize Theme');
    });

    test('Customize Theme appears for users with edit_theme_options capability', () => {
        setupWordPressGlobals({
            userCaps: {
                manage_options: false,
                edit_theme_options: true,
            }
        });

        const results = searchCommands('theme');
        const customizeCommand = results.find(r => r.id === 'customize');
        
        expect(customizeCommand).toBeDefined();
        expect(customizeCommand.title).toContain('Customize Theme');
        
        console.log('✅ User with edit_theme_options capability can access Customize Theme');
    });

    test('Customize Theme does not appear for users without theme capabilities', () => {
        setupWordPressGlobals({
            userCaps: {
                manage_options: false,
                customize: false,
                edit_theme_options: false,
                edit_posts: true,
            }
        });

        const results = searchCommands('theme');
        const customizeCommand = results.find(r => r.id === 'customize');
        
        expect(customizeCommand).toBeUndefined();
        
        console.log('✅ Users without theme capabilities cannot access Customize Theme');
    });

    test('enhanced keywords make theme customization more discoverable', () => {
        setupWordPressGlobals({
            userCaps: {
                manage_options: true,
            }
        });

        const searchTerms = ['theme', 'themes', 'customize', 'customizer', 'design', 'style', 'appearance'];
        
        searchTerms.forEach(term => {
            const results = searchCommands(term);
            const customizeCommand = results.find(r => r.id === 'customize');
            
            expect(customizeCommand).toBeDefined();
            console.log(`✅ "${term}" finds Customize Theme command`);
        });
    });

    test('show all available results for theme search', () => {
        setupWordPressGlobals({
            userCaps: {
                manage_options: true,
                edit_posts: true,
                edit_pages: true,
            }
        });

        const results = searchCommands('theme');
        
        console.log('\n=== All results for "theme" search ===');
        results.forEach((result, index) => {
            console.log(`${index + 1}. ${result.title} (${result.id})`);
            console.log(`   Keywords: [${result.keywords.join(', ')}]`);
        });
        
        expect(results.length).toBeGreaterThan(0);
        
        const customizeCommand = results.find(r => r.id === 'customize');
        expect(customizeCommand).toBeDefined();
    });
});