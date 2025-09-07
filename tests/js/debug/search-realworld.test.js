import { searchCommands } from '../../../src/js/commands';
import { 
    setupWordPressGlobals,
    cleanup 
} from '../utils/test-helpers';

describe('Real-world Search Debug', () => {
    afterEach(() => {
        cleanup();
    });

    test('test search with typical WordPress user capabilities', () => {
        // Test with typical admin user capabilities
        setupWordPressGlobals({
            userCaps: {
                switch_themes: true,
                edit_theme_options: true,
                customize: true,
                manage_options: true,
                edit_posts: true,
                edit_pages: true,
                upload_files: true,
            }
        });

        console.log('\n=== TESTING WITH ADMIN CAPABILITIES ===');
        const results = searchCommands('theme');
        
        console.log(`\nSearch "theme" results: ${results.length}`);
        results.forEach((result, index) => {
            console.log(`${index + 1}. ${result.title} (${result.id})`);
            console.log(`   Category: ${result.category}`);
            console.log(`   Keywords: [${result.keywords.join(', ')}]`);
        });

        expect(results.length).toBeGreaterThan(0);
        
        const customizeCommand = results.find(r => r.id === 'customize');
        if (!customizeCommand) {
            console.log('\n❌ CUSTOMIZE THEME COMMAND NOT FOUND!');
            console.log('Available commands:', results.map(r => r.id));
        } else {
            console.log('\n✅ Customize Theme command found in results');
        }
    });

    test('test search with editor capabilities (no manage_options)', () => {
        setupWordPressGlobals({
            userCaps: {
                edit_posts: true,
                edit_pages: true,
                upload_files: true,
                manage_options: false, // Editor doesn't have this
            }
        });

        console.log('\n=== TESTING WITH EDITOR CAPABILITIES ===');
        const results = searchCommands('theme');
        
        console.log(`\nSearch "theme" results: ${results.length}`);
        results.forEach((result, index) => {
            console.log(`${index + 1}. ${result.title} (${result.id})`);
        });

        // Should not find customize command
        const customizeCommand = results.find(r => r.id === 'customize');
        expect(customizeCommand).toBeUndefined();
        console.log('\n✅ Correctly filtered out Customize Theme for editor user');
    });

    test('test with undefined capabilities', () => {
        setupWordPressGlobals({
            userCaps: undefined
        });

        console.log('\n=== TESTING WITH UNDEFINED CAPABILITIES ===');
        const results = searchCommands('theme');
        
        console.log(`Search "theme" results: ${results.length}`);
        
        // Should not find customize command when no capabilities
        const customizeCommand = results.find(r => r.id === 'customize');
        expect(customizeCommand).toBeUndefined();
        console.log('✅ Correctly filtered out when no capabilities defined');
    });

    test('debug what user sees when searching for common terms', () => {
        setupWordPressGlobals({
            userCaps: {
                manage_options: true,
                edit_posts: true,
                edit_pages: true,
            }
        });

        const commonSearches = ['page', 'post', 'plugin', 'theme', 'menu', 'media'];
        
        console.log('\n=== COMMON SEARCH TERMS DEBUG ===');
        commonSearches.forEach(term => {
            const results = searchCommands(term);
            console.log(`\n"${term}" -> ${results.length} results:`);
            results.forEach(result => {
                console.log(`  - ${result.title}`);
            });
        });
    });
});