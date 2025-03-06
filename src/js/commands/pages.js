import { __ } from '@wordpress/i18n';
import { COMMAND_TYPES, COMMAND_CATEGORIES } from './types';

export const pageCommands = [
    {
        id: 'search-pages',
        type: COMMAND_TYPES.SEARCH,
        category: COMMAND_CATEGORIES.CONTENT,
        title: __('Search Pages', 'lexia-command'),
        keywords: ['find pages', 'search pages', 'pages', 'find page'],
        icon: '📄',
        action: (closeCommandBar) => {
            const event = new CustomEvent('lexiaCommand:showPageSearch');
            window.dispatchEvent(event);
            // Prevent closing the command bar for page search
            return false;
        },
    },
];