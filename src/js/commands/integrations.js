/**
 * WordPress Core & Plugin Integrations
 * Commands for popular WordPress features and plugins
 */

import { __ } from '@wordpress/i18n';
import { COMMAND_TYPES, COMMAND_CATEGORIES } from './types';

/**
 * WordPress Core Integrations
 */
export const wordpressCoreCommands = [
    // Media Library
    {
        id: 'open-media-library',
        title: __('Open Media Library', 'lexia-command'),
        keywords: ['media', 'library', 'images', 'files', 'uploads'],
        description: __('Browse and manage media files', 'lexia-command'),
        category: COMMAND_CATEGORIES.CONTENT,
        type: COMMAND_TYPES.NAVIGATE,
        icon: '🖼️',
        priority: 8,
        action: () => {
            window.location.href = window.lexiaCommandData.adminUrl + 'upload.php';
        }
    },

    // Comments
    {
        id: 'manage-comments',
        title: __('Manage Comments', 'lexia-command'),
        keywords: ['comments', 'moderation', 'approve', 'spam'],
        description: __('View and moderate comments', 'lexia-command'),
        category: COMMAND_CATEGORIES.CONTENT,
        type: COMMAND_TYPES.NAVIGATE,
        icon: '💬',
        priority: 7,
        action: () => {
            window.location.href = window.lexiaCommandData.adminUrl + 'edit-comments.php';
        }
    },

    // Menus
    {
        id: 'edit-menus',
        title: __('Edit Menus', 'lexia-command'),
        keywords: ['menu', 'navigation', 'nav', 'header', 'footer'],
        description: __('Customize site navigation menus', 'lexia-command'),
        category: COMMAND_CATEGORIES.SETTINGS,
        type: COMMAND_TYPES.NAVIGATE,
        icon: '📋',
        priority: 8,
        action: () => {
            window.location.href = window.lexiaCommandData.adminUrl + 'nav-menus.php';
        }
    },

    // Widgets
    {
        id: 'edit-widgets',
        title: __('Edit Widgets', 'lexia-command'),
        keywords: ['widgets', 'sidebar', 'blocks', 'customizer'],
        description: __('Manage sidebar widgets and blocks', 'lexia-command'),
        category: COMMAND_CATEGORIES.SETTINGS,
        type: COMMAND_TYPES.NAVIGATE,
        icon: '🧩',
        priority: 7,
        action: () => {
            // Check if block-based widgets are enabled
            const isBlockWidgets = window.lexiaCommandData?.isBlockWidgets;
            if (isBlockWidgets) {
                window.location.href = window.lexiaCommandData.adminUrl + 'widgets.php';
            } else {
                window.location.href = window.lexiaCommandData.adminUrl + 'widgets.php';
            }
        }
    },

    // Users
    {
        id: 'manage-users',
        title: __('Manage Users', 'lexia-command'),
        keywords: ['users', 'members', 'accounts', 'roles'],
        description: __('View and edit user accounts', 'lexia-command'),
        category: COMMAND_CATEGORIES.USERS,
        type: COMMAND_TYPES.NAVIGATE,
        icon: '👥',
        priority: 6,
        action: () => {
            window.location.href = window.lexiaCommandData.adminUrl + 'users.php';
        }
    },

    // Site Health
    {
        id: 'site-health',
        title: __('Site Health', 'lexia-command'),
        keywords: ['health', 'status', 'debug', 'info'],
        description: __('Check site health and debug info', 'lexia-command'),
        category: COMMAND_CATEGORIES.SETTINGS,
        type: COMMAND_TYPES.NAVIGATE,
        icon: '🏥',
        priority: 6,
        action: () => {
            window.location.href = window.lexiaCommandData.adminUrl + 'site-health.php';
        }
    },

    // Export/Import
    {
        id: 'export-content',
        title: __('Export Content', 'lexia-command'),
        keywords: ['export', 'backup', 'download', 'xml'],
        description: __('Export posts, pages, and other content', 'lexia-command'),
        category: COMMAND_CATEGORIES.SETTINGS,
        type: COMMAND_TYPES.NAVIGATE,
        icon: '📤',
        priority: 5,
        action: () => {
            window.location.href = window.lexiaCommandData.adminUrl + 'export.php';
        }
    },

    {
        id: 'import-content',
        title: __('Import Content', 'lexia-command'),
        keywords: ['import', 'upload', 'migrate', 'xml'],
        description: __('Import content from other sites', 'lexia-command'),
        category: COMMAND_CATEGORIES.SETTINGS,
        type: COMMAND_TYPES.NAVIGATE,
        icon: '📥',
        priority: 5,
        action: () => {
            window.location.href = window.lexiaCommandData.adminUrl + 'import.php';
        }
    }
];

/**
 * Popular Plugin Integrations
 * Commands for widely-used WordPress plugins
 */
export const pluginIntegrations = [
    // Yoast SEO
    {
        id: 'yoast-seo-dashboard',
        title: __('Yoast SEO Dashboard', 'lexia-command'),
        keywords: ['yoast', 'seo', 'optimization', 'search'],
        description: __('Manage SEO settings and analysis', 'lexia-command'),
        category: COMMAND_CATEGORIES.SETTINGS,
        type: COMMAND_TYPES.NAVIGATE,
        icon: '🎯',
        priority: 8,
        condition: () => window.lexiaCommandData?.plugins?.yoast_seo,
        action: () => {
            window.location.href = window.lexiaCommandData.adminUrl + 'admin.php?page=wpseo_dashboard';
        }
    },

    // WooCommerce
    {
        id: 'woocommerce-orders',
        title: __('WooCommerce Orders', 'lexia-command'),
        keywords: ['woocommerce', 'orders', 'sales', 'ecommerce'],
        description: __('View and manage orders', 'lexia-command'),
        category: COMMAND_CATEGORIES.CONTENT,
        type: COMMAND_TYPES.NAVIGATE,
        icon: '🛒',
        priority: 9,
        condition: () => window.lexiaCommandData?.plugins?.woocommerce,
        action: () => {
            window.location.href = window.lexiaCommandData.adminUrl + 'edit.php?post_type=shop_order';
        }
    },

    {
        id: 'woocommerce-products',
        title: __('WooCommerce Products', 'lexia-command'),
        keywords: ['woocommerce', 'products', 'catalog', 'inventory'],
        description: __('Manage product catalog', 'lexia-command'),
        category: COMMAND_CATEGORIES.CONTENT,
        type: COMMAND_TYPES.NAVIGATE,
        icon: '📦',
        priority: 9,
        condition: () => window.lexiaCommandData?.plugins?.woocommerce,
        action: () => {
            window.location.href = window.lexiaCommandData.adminUrl + 'edit.php?post_type=product';
        }
    },

    {
        id: 'woocommerce-analytics',
        title: __('WooCommerce Analytics', 'lexia-command'),
        keywords: ['woocommerce', 'analytics', 'reports', 'revenue'],
        description: __('View sales reports and analytics', 'lexia-command'),
        category: COMMAND_CATEGORIES.CONTENT,
        type: COMMAND_TYPES.NAVIGATE,
        icon: '📊',
        priority: 8,
        condition: () => window.lexiaCommandData?.plugins?.woocommerce,
        action: () => {
            window.location.href = window.lexiaCommandData.adminUrl + 'admin.php?page=wc-admin&path=%2Fanalytics%2Foverview';
        }
    },

    // Contact Form 7
    {
        id: 'contact-form-7',
        title: __('Contact Forms', 'lexia-command'),
        keywords: ['contact', 'form', 'cf7', 'contact form 7'],
        description: __('Manage contact forms', 'lexia-command'),
        category: COMMAND_CATEGORIES.CONTENT,
        type: COMMAND_TYPES.NAVIGATE,
        icon: '📝',
        priority: 7,
        condition: () => window.lexiaCommandData?.plugins?.contact_form_7,
        action: () => {
            window.location.href = window.lexiaCommandData.adminUrl + 'admin.php?page=wpcf7';
        }
    },

    // Elementor
    {
        id: 'elementor-library',
        title: __('Elementor Template Library', 'lexia-command'),
        keywords: ['elementor', 'templates', 'library', 'blocks'],
        description: __('Browse Elementor templates', 'lexia-command'),
        category: COMMAND_CATEGORIES.CONTENT,
        type: COMMAND_TYPES.NAVIGATE,
        icon: '🎨',
        priority: 8,
        condition: () => window.lexiaCommandData?.plugins?.elementor,
        action: () => {
            window.location.href = window.lexiaCommandData.adminUrl + 'edit.php?post_type=elementor_library';
        }
    },

    // Wordfence Security
    {
        id: 'wordfence-scan',
        title: __('Wordfence Security Scan', 'lexia-command'),
        keywords: ['wordfence', 'security', 'scan', 'malware'],
        description: __('Run security scan', 'lexia-command'),
        category: COMMAND_CATEGORIES.SETTINGS,
        type: COMMAND_TYPES.NAVIGATE,
        icon: '🛡️',
        priority: 7,
        condition: () => window.lexiaCommandData?.plugins?.wordfence,
        action: () => {
            window.location.href = window.lexiaCommandData.adminUrl + 'admin.php?page=WordfenceScan';
        }
    },

    // UpdraftPlus
    {
        id: 'updraftplus-backup',
        title: __('Create Backup (UpdraftPlus)', 'lexia-command'),
        keywords: ['updraftplus', 'backup', 'restore', 'migration'],
        description: __('Create site backup', 'lexia-command'),
        category: COMMAND_CATEGORIES.SETTINGS,
        type: COMMAND_TYPES.NAVIGATE,
        icon: '💾',
        priority: 7,
        condition: () => window.lexiaCommandData?.plugins?.updraftplus,
        action: () => {
            window.location.href = window.lexiaCommandData.adminUrl + 'admin.php?page=updraftplus';
        }
    },

    // WP Rocket
    {
        id: 'wp-rocket-settings',
        title: __('WP Rocket Settings', 'lexia-command'),
        keywords: ['wp rocket', 'cache', 'performance', 'speed'],
        description: __('Configure caching settings', 'lexia-command'),
        category: COMMAND_CATEGORIES.SETTINGS,
        type: COMMAND_TYPES.NAVIGATE,
        icon: '🚀',
        priority: 6,
        condition: () => window.lexiaCommandData?.plugins?.wp_rocket,
        action: () => {
            window.location.href = window.lexiaCommandData.adminUrl + 'admin.php?page=wprocket';
        }
    },

    // Advanced Custom Fields
    {
        id: 'acf-field-groups',
        title: __('Custom Fields (ACF)', 'lexia-command'),
        keywords: ['acf', 'custom fields', 'advanced', 'fields'],
        description: __('Manage custom field groups', 'lexia-command'),
        category: COMMAND_CATEGORIES.CONTENT,
        type: COMMAND_TYPES.NAVIGATE,
        icon: '🔧',
        priority: 7,
        condition: () => window.lexiaCommandData?.plugins?.advanced_custom_fields,
        action: () => {
            window.location.href = window.lexiaCommandData.adminUrl + 'edit.php?post_type=acf-field-group';
        }
    },

    // All in One SEO
    {
        id: 'aioseo-dashboard',
        title: __('All in One SEO Dashboard', 'lexia-command'),
        keywords: ['aioseo', 'seo', 'all in one', 'optimization'],
        description: __('Manage SEO settings', 'lexia-command'),
        category: COMMAND_CATEGORIES.SETTINGS,
        type: COMMAND_TYPES.NAVIGATE,
        icon: '📈',
        priority: 8,
        condition: () => window.lexiaCommandData?.plugins?.all_in_one_seo,
        action: () => {
            window.location.href = window.lexiaCommandData.adminUrl + 'admin.php?page=aioseo';
        }
    },

    // MonsterInsights (Google Analytics)
    {
        id: 'monsterinsights-reports',
        title: __('Analytics Reports (MonsterInsights)', 'lexia-command'),
        keywords: ['monsterinsights', 'analytics', 'google', 'reports'],
        description: __('View Google Analytics reports', 'lexia-command'),
        category: COMMAND_CATEGORIES.CONTENT,
        type: COMMAND_TYPES.NAVIGATE,
        icon: '📊',
        priority: 7,
        condition: () => window.lexiaCommandData?.plugins?.google_analytics_for_wordpress,
        action: () => {
            window.location.href = window.lexiaCommandData.adminUrl + 'admin.php?page=monsterinsights_reports';
        }
    },

    // WPForms
    {
        id: 'wpforms-entries',
        title: __('Form Entries (WPForms)', 'lexia-command'),
        keywords: ['wpforms', 'forms', 'entries', 'submissions'],
        description: __('View form submissions', 'lexia-command'),
        category: COMMAND_CATEGORIES.CONTENT,
        type: COMMAND_TYPES.NAVIGATE,
        icon: '📋',
        priority: 7,
        condition: () => window.lexiaCommandData?.plugins?.wpforms_lite || window.lexiaCommandData?.plugins?.wpforms,
        action: () => {
            window.location.href = window.lexiaCommandData.adminUrl + 'admin.php?page=wpforms-entries';
        }
    }
];

/**
 * Quick Action Commands
 * Fast actions that don't require navigation
 */
export const quickActionCommands = [
    {
        id: 'clear-cache-quick',
        title: __('Clear All Cache', 'lexia-command'),
        keywords: ['cache', 'clear', 'purge', 'refresh'],
        description: __('Clear all caching plugins cache', 'lexia-command'),
        category: COMMAND_CATEGORIES.SETTINGS,
        type: COMMAND_TYPES.ACTION,
        icon: '🔄',
        priority: 8,
        action: async () => {
            // Try multiple cache clearing methods
            const cacheActions = [];
            
            // WP Rocket
            if (window.lexiaCommandData?.plugins?.wp_rocket) {
                cacheActions.push(
                    fetch(window.lexiaCommandData.adminUrl + 'admin-ajax.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: 'action=rocket_purge_cache&_ajax_nonce=' + window.lexiaCommandData.nonce
                    })
                );
            }
            
            // W3 Total Cache
            if (window.lexiaCommandData?.plugins?.w3_total_cache) {
                cacheActions.push(
                    fetch(window.lexiaCommandData.adminUrl + 'admin-ajax.php', {
                        method: 'POST', 
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: 'action=w3tc_purge_all&_ajax_nonce=' + window.lexiaCommandData.nonce
                    })
                );
            }
            
            try {
                await Promise.all(cacheActions);
                window.dispatchEvent(new CustomEvent('lexiaCommand:showNotification', {
                    detail: { message: __('Cache cleared successfully!', 'lexia-command'), type: 'success' }
                }));
            } catch (error) {
                window.dispatchEvent(new CustomEvent('lexiaCommand:showNotification', {
                    detail: { message: __('Failed to clear cache', 'lexia-command'), type: 'error' }
                }));
            }
        }
    },

    {
        id: 'maintenance-mode',
        title: __('Toggle Maintenance Mode', 'lexia-command'),
        keywords: ['maintenance', 'mode', 'coming soon', 'offline'],
        description: __('Enable/disable maintenance mode', 'lexia-command'),
        category: COMMAND_CATEGORIES.SETTINGS,
        type: COMMAND_TYPES.ACTION,
        icon: '🚧',
        priority: 6,
        condition: () => window.lexiaCommandData?.plugins?.maintenance_mode || window.lexiaCommandData?.plugins?.coming_soon,
        action: async () => {
            try {
                const response = await fetch(window.lexiaCommandData.adminUrl + 'admin-ajax.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: 'action=lexia_toggle_maintenance&_ajax_nonce=' + window.lexiaCommandData.nonce
                });
                
                const data = await response.json();
                window.dispatchEvent(new CustomEvent('lexiaCommand:showNotification', {
                    detail: { 
                        message: data.success ? 
                            __('Maintenance mode toggled!', 'lexia-command') : 
                            __('Failed to toggle maintenance mode', 'lexia-command'),
                        type: data.success ? 'success' : 'error'
                    }
                }));
            } catch (error) {
                console.error('Maintenance mode toggle failed:', error);
            }
        }
    }
];

/**
 * Get all integration commands
 * Filters based on available plugins/features
 */
export const getIntegrationCommands = () => {
    const filteredPluginIntegrations = pluginIntegrations.filter(cmd => {
        return !cmd.condition || !!cmd.condition(); // Convert to boolean to handle undefined
    });
    
    const filteredQuickActions = quickActionCommands.filter(cmd => {
        return !cmd.condition || !!cmd.condition(); // Convert to boolean to handle undefined
    });
    
    const allCommands = [
        ...wordpressCoreCommands,
        ...filteredPluginIntegrations,
        ...filteredQuickActions
    ];
    
    return allCommands.sort((a, b) => (b.priority || 0) - (a.priority || 0));
};

export default getIntegrationCommands;