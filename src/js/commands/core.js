import { __ } from '@wordpress/i18n';
import { COMMAND_TYPES, COMMAND_CATEGORIES } from './types';

export const coreCommands = [
    {
        id: 'create-page',
        type: COMMAND_TYPES.CREATE,
        category: COMMAND_CATEGORIES.CONTENT,
        title: __('Create a new page', 'lexia-command'),
        keywords: ['new page', 'add page', 'create page'],
        icon: '📄',
        action: () => {
            window.location.href = `${window.lexiaCommandData.adminUrl}post-new.php?post_type=page`;
        },
    },
    {
        id: 'create-post',
        type: COMMAND_TYPES.CREATE,
        category: COMMAND_CATEGORIES.CONTENT,
        title: __('Create a new post', 'lexia-command'),
        keywords: ['new post', 'add post', 'create post', 'write'],
        icon: '✏️',
        action: () => {
            window.location.href = `${window.lexiaCommandData.adminUrl}post-new.php`;
        },
    },
    {
        id: 'media-library',
        type: COMMAND_TYPES.MANAGE,
        category: COMMAND_CATEGORIES.CONTENT,
        title: __('Open Media Library', 'lexia-command'),
        keywords: ['media', 'images', 'library', 'files'],
        icon: '🖼️',
        action: () => {
            window.location.href = `${window.lexiaCommandData.adminUrl}upload.php`;
        },
    },
    {
        id: 'settings',
        type: COMMAND_TYPES.MANAGE,
        category: COMMAND_CATEGORIES.SETTINGS,
        title: __('Site Settings', 'lexia-command'),
        keywords: ['settings', 'options', 'configure'],
        icon: '⚙️',
        action: () => {
            window.location.href = `${window.lexiaCommandData.adminUrl}options-general.php`;
        },
    },
    {
        id: 'customize',
        type: COMMAND_TYPES.MANAGE,
        category: COMMAND_CATEGORIES.SETTINGS,
        title: __('Customize Theme', 'lexia-command'),
        keywords: ['customize', 'theme', 'appearance'],
        icon: '🎨',
        action: () => {
            window.location.href = `${window.lexiaCommandData.adminUrl}customize.php`;
        },
    },
    {
        id: 'menus',
        type: COMMAND_TYPES.MANAGE,
        category: COMMAND_CATEGORIES.CONTENT,
        title: __('Manage Menus', 'lexia-command'),
        keywords: ['menus', 'navigation', 'nav'],
        icon: '📋',
        action: () => {
            window.location.href = `${window.lexiaCommandData.adminUrl}nav-menus.php`;
        },
    },
];