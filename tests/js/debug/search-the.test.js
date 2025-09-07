import { searchCommands } from '../../../src/js/commands';
import { 
    setupWordPressGlobals,
    cleanup 
} from '../utils/test-helpers';

describe('Search Debug: "the" query', () => {
    afterEach(() => {
        cleanup();
    });

    test('search for "the" should return Customize Theme command for admin', () => {
        setupWordPressGlobals({
            userCaps: {
                manage_options: true,
                customize: true,
                edit_theme_options: true,
            }
        });

        const results = searchCommands('the');
        console.log('=== Search results for "the" ===');
        results.forEach((result, index) => {
            console.log(`${index + 1}. ${result.title} (${result.id})`);
            console.log(`   Keywords: [${result.keywords.join(', ')}]`);
        });

        const customizeCommand = results.find(r => r.id === 'customize');
        expect(customizeCommand).toBeDefined();
        expect(customizeCommand.title.toLowerCase()).toContain('theme');
    });

    test('search for "the" should return Customize Theme for user with theme caps', () => {
        setupWordPressGlobals({
            userCaps: {
                manage_options: false,
                customize: true,
            }
        });

        const results = searchCommands('the');
        console.log('=== Search results for "the" (theme caps only) ===');
        results.forEach((result, index) => {
            console.log(`${index + 1}. ${result.title} (${result.id})`);
        });

        const customizeCommand = results.find(r => r.id === 'customize');
        expect(customizeCommand).toBeDefined();
    });

    test('search for "the" should return nothing for user without any caps', () => {
        setupWordPressGlobals({
            userCaps: {
                manage_options: false,
                customize: false,
                edit_theme_options: false,
            }
        });

        const results = searchCommands('the');
        console.log('=== Search results for "the" (no caps) ===');
        results.forEach((result, index) => {
            console.log(`${index + 1}. ${result.title} (${result.id})`);
        });

        expect(results.length).toBe(0);
    });

    test('verify "theme" still works', () => {
        setupWordPressGlobals({
            userCaps: {
                manage_options: true,
            }
        });

        const results = searchCommands('theme');
        console.log('=== Search results for "theme" ===');
        results.forEach((result, index) => {
            console.log(`${index + 1}. ${result.title} (${result.id})`);
        });

        const customizeCommand = results.find(r => r.id === 'customize');
        expect(customizeCommand).toBeDefined();
    });

    test('check if window.lexiaCommandData is properly set', () => {
        setupWordPressGlobals({
            userCaps: {
                manage_options: true,
            }
        });

        console.log('=== window.lexiaCommandData ===');
        console.log(JSON.stringify(window.lexiaCommandData, null, 2));

        expect(window.lexiaCommandData).toBeDefined();
        expect(window.lexiaCommandData.userCaps).toBeDefined();
        expect(window.lexiaCommandData.userCaps.manage_options).toBe(true);
    });
});