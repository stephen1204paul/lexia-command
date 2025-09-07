import { COMMAND_TYPES, COMMAND_CATEGORIES } from './types';
import { coreCommands } from './core';
import { pluginCommands } from './plugins';
import { pageCommands } from './pages';
import { postCommands } from './posts';
import { getIntegrationCommands } from './integrations';

// Command definitions
export const commands = [
    ...coreCommands,
    ...pluginCommands,
    ...pageCommands,
    ...postCommands,
    ...getIntegrationCommands(),
];

// Search commands
export function searchCommands(query) {
    const normalizedQuery = query ? query.toLowerCase() : '';
    console.log('🔍 Search query:', query, '-> normalized:', normalizedQuery);
    
    const userCaps = window?.lexiaCommandData?.userCaps || {};
    console.log('👤 User capabilities:', userCaps);
    
    const filteredCommands = commands.filter(command => {
        console.log(`\n📋 Checking command: ${command.id} (${command.title})`);
        console.log(`   Category: ${command.category}`);
        console.log(`   Keywords: [${command.keywords.join(', ')}]`);
        
        // Plugin management requires manage_options capability
        if (command.category === COMMAND_CATEGORIES.PLUGINS && !userCaps.manage_options) {
            console.log(`   ❌ Rejected: Plugin command without manage_options`);
            return false;
        }
        
        // Settings commands - be more permissive
        if (command.category === COMMAND_CATEGORIES.SETTINGS) {
            console.log(`   ⚙️ Settings command detected`);
            // Allow theme customization if user has theme capabilities
            if (command.id === 'customize' && (userCaps.customize || userCaps.edit_theme_options)) {
                console.log(`   ✅ Customize command allowed: customize=${userCaps.customize}, edit_theme_options=${userCaps.edit_theme_options}`);
                // Allow access for users with theme capabilities
            } else if (!userCaps.manage_options) {
                console.log(`   ❌ Rejected: Settings command without manage_options or theme capabilities`);
                return false;
            } else {
                console.log(`   ✅ Settings command allowed with manage_options`);
            }
        }
        
        // User management requires manage_options capability
        if (command.category === COMMAND_CATEGORIES.USERS && !userCaps.manage_options) {
            console.log(`   ❌ Rejected: User command without manage_options`);
            return false;
        }
        
        // If no query, return all available commands
        if (!normalizedQuery) {
            console.log(`   ✅ Included: No query filter`);
            return true;
        }
        
        // Search in title and keywords
        const titleMatch = command.title.toLowerCase().includes(normalizedQuery);
        const keywordMatch = command.keywords.some(keyword => keyword.toLowerCase().includes(normalizedQuery));
        
        console.log(`   🔍 Title match ("${command.title.toLowerCase()}" includes "${normalizedQuery}"): ${titleMatch}`);
        console.log(`   🔍 Keyword match: ${keywordMatch}`);
        
        const isMatch = titleMatch || keywordMatch;
        console.log(`   ${isMatch ? '✅' : '❌'} Final result: ${isMatch ? 'INCLUDED' : 'EXCLUDED'}`);
        
        return isMatch;
    });
    
    console.log(`\n📊 Search complete. Found ${filteredCommands.length} commands for query "${query}"`);
    filteredCommands.forEach((cmd, index) => {
        console.log(`   ${index + 1}. ${cmd.title} (${cmd.id})`);
    });
    
    return filteredCommands;
}