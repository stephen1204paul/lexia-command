import { __ } from '@wordpress/i18n';
import { COMMAND_TYPES, COMMAND_CATEGORIES } from './types';

export const coreCommands = [
    // Removed duplicate search-pages command that was conflicting with the one in pages.js
    {
        id: 'create-page',
        type: COMMAND_TYPES.CREATE,
        category: COMMAND_CATEGORIES.CONTENT,
        title: __('Create a new page', 'lexia-command'),
        description: __('Create a new static page for your website', 'lexia-command'),
        keywords: ['new page', 'add page', 'create page', 'static page'],
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
        description: __('Create a new blog post or article', 'lexia-command'),
        keywords: ['new post', 'add post', 'create post', 'write', 'blog', 'article'],
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
        description: __('Manage uploads, images, videos and other media files', 'lexia-command'),
        keywords: ['media', 'images', 'library', 'files', 'uploads', 'videos', 'photos'],
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
        description: __('Configure general site settings and options', 'lexia-command'),
        keywords: ['settings', 'options', 'configure', 'general', 'site config'],
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
        description: __('Customize your theme appearance, colors, and layout', 'lexia-command'),
        keywords: ['customize', 'theme', 'appearance', 'customizer', 'design', 'style', 'themes', 'colors'],
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
        description: __('Create and manage navigation menus for your site', 'lexia-command'),
        keywords: ['menus', 'navigation', 'nav', 'menu', 'navbar', 'links'],
        icon: '📋',
        action: () => {
            window.location.href = `${window.lexiaCommandData.adminUrl}nav-menus.php`;
        },
    },
    {
        id: 'keyboard-shortcuts',
        type: COMMAND_TYPES.MANAGE,
        category: COMMAND_CATEGORIES.SETTINGS,
        title: __('Keyboard Shortcuts Settings', 'lexia-command'),
        description: __('Customize keyboard shortcuts for Lexia Command', 'lexia-command'),
        keywords: ['keyboard', 'shortcuts', 'hotkeys', 'settings', 'customize', 'keys', 'bindings'],
        icon: '⌨️',
        action: () => {
            // Dispatch event to open shortcut settings
            window.dispatchEvent(new CustomEvent('lexiaCommand:openShortcutSettings'));
            // Return false to prevent the command bar from closing
            return false;
        },
    },
];