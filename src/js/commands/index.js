import { __ } from '@wordpress/i18n';

// Command types
export const COMMAND_TYPES = {
    CREATE: 'create',
    EDIT: 'edit',
    DELETE: 'delete',
    MANAGE: 'manage',
    SEARCH: 'search',
};

// Command categories
export const COMMAND_CATEGORIES = {
    CONTENT: 'content',
    PLUGINS: 'plugins',
    SETTINGS: 'settings',
    USERS: 'users',
};

// Command definitions
export const commands = [
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
        id: 'create-user',
        type: COMMAND_TYPES.CREATE,
        category: COMMAND_CATEGORIES.USERS,
        title: __('Create a new user', 'lexia-command'),
        keywords: ['new user', 'add user', 'create user'],
        icon: '👤',
        action: () => {
            window.location.href = `${window.lexiaCommandData.adminUrl}user-new.php`;
        },
    },
    {
        id: 'manage-users',
        type: COMMAND_TYPES.MANAGE,
        category: COMMAND_CATEGORIES.USERS,
        title: __('Manage Users', 'lexia-command'),
        keywords: ['users', 'all users', 'user list'],
        icon: '👥',
        action: () => {
            window.location.href = `${window.lexiaCommandData.adminUrl}users.php`;
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