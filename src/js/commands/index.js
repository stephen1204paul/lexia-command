import { COMMAND_TYPES, COMMAND_CATEGORIES } from './types';
import { coreCommands } from './core';
import { pluginCommands } from './plugins';

// Command definitions
export const commands = [
    ...coreCommands,
    ...pluginCommands,
];

// Search commands
export function searchCommands(query) {
    if (!query) return [];
    
    const normalizedQuery = query.toLowerCase();
    return commands.filter(command => {
        // Check if user has required capabilities
        if (command.category === COMMAND_CATEGORIES.PLUGINS && !window.lexiaCommandData.userCaps.manage_options) {
            return false;
        }
        if (command.category === COMMAND_CATEGORIES.SETTINGS && !window.lexiaCommandData.userCaps.manage_options) {
            return false;
        }
        if (command.category === COMMAND_CATEGORIES.USERS && !window.lexiaCommandData.userCaps.manage_options) {
            return false;
        }
        
        return (
            command.title.toLowerCase().includes(normalizedQuery) ||
            command.keywords.some(keyword => keyword.toLowerCase().includes(normalizedQuery))
        );
    });
}