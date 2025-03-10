import { __ } from '@wordpress/i18n';
import { COMMAND_TYPES, COMMAND_CATEGORIES } from './types';

export const postCommands = [
    {
        id: 'search-posts',
        type: COMMAND_TYPES.SEARCH,
        category: COMMAND_CATEGORIES.CONTENT,
        title: __('Search Posts', 'lexia-command'),
        keywords: ['find posts', 'search posts', 'posts', 'find post', 'blog'],
        icon: '📝',
        action: (closeCommandBar) => {
            const event = new CustomEvent('lexiaCommand:showPostSearch');
            window.dispatchEvent(event);
            // Prevent closing the command bar for post search
            return false;
        },
    },
];