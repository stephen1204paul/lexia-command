import { __ } from '@wordpress/i18n';
import { COMMAND_TYPES, COMMAND_CATEGORIES } from './types';

export const pluginCommands = [
    {
        id: 'plugins',
        type: COMMAND_TYPES.MANAGE,
        category: COMMAND_CATEGORIES.PLUGINS,
        title: __('Manage Plugins', 'lexia-command'),
        keywords: ['plugins', 'add plugin', 'install plugin'],
        icon: '🔌',
        action: () => {
            window.location.href = `${window.lexiaCommandData.adminUrl}plugins.php`;
        },
    },
    {
        id: 'install-plugins',
        type: COMMAND_TYPES.ACTION,
        category: COMMAND_CATEGORIES.PLUGINS,
        title: __('Install Plugin', 'lexia-command'),
        keywords: ['install', 'plugin'],
        icon: '🔌',
        action: (closeCommandBar) => {
            const event = new CustomEvent('lexiaCommand:showPluginSearch');
            window.dispatchEvent(event);
            // Prevent closing the command bar for plugin installation
            return false;
        },
    },
];