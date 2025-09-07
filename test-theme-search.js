// Test theme search after rebuild
console.log('=== Testing Theme Search After Rebuild ===');

// Wait for the plugin to load
setTimeout(() => {
    if (window.LexiaCommand && window.LexiaCommand.searchCommands) {
        console.log('Plugin loaded successfully');
        
        // Test search for "theme"
        const themeResults = window.LexiaCommand.searchCommands('theme');
        console.log('Search results for "theme":', themeResults);
        console.log('Result count:', themeResults.length);
        
        if (themeResults.length > 0) {
            themeResults.forEach((result, index) => {
                console.log(`Result ${index + 1}:`, {
                    id: result.id,
                    title: result.title,
                    keywords: result.keywords,
                    category: result.category
                });
            });
        } else {
            console.log('No results found for "theme"');
        }
        
        // Test search for "customize"
        const customizeResults = window.LexiaCommand.searchCommands('customize');
        console.log('\nSearch results for "customize":', customizeResults);
        console.log('Result count:', customizeResults.length);
        
        // Test search for "appearance"
        const appearanceResults = window.LexiaCommand.searchCommands('appearance');
        console.log('\nSearch results for "appearance":', appearanceResults);
        console.log('Result count:', appearanceResults.length);
        
        // Show all available commands
        const allCommands = window.LexiaCommand.searchCommands('');
        console.log('\nAll available commands:');
        allCommands.forEach((cmd, index) => {
            console.log(`${index + 1}. ${cmd.title} (${cmd.id}) - Keywords: ${cmd.keywords.join(', ')}`);
        });
        
        // Check user capabilities
        console.log('\nUser capabilities:', window.lexiaCommandData?.userCaps);
        
    } else {
        console.log('Plugin not loaded or searchCommands not available');
    }
}, 1000);