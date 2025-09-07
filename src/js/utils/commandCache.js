/**
 * Command Cache System
 * Provides fast access to commands with intelligent caching and background loading
 */

import apiFetch from '@wordpress/api-fetch';

// Cache configuration
const CACHE_CONFIG = {
    PREFIX: 'lexia_command_cache_',
    TTL: {
        STATIC_COMMANDS: 24 * 60 * 60 * 1000, // 24 hours
        RECENT_CONTENT: 4 * 60 * 60 * 1000,   // 4 hours
        PLUGINS: 12 * 60 * 60 * 1000,         // 12 hours
        SEARCH_RESULTS: 30 * 60 * 1000,       // 30 minutes
        USER_PREFERENCES: 7 * 24 * 60 * 60 * 1000 // 7 days
    },
    LIMITS: {
        RECENT_POSTS: 50,
        RECENT_PAGES: 20,
        POPULAR_COMMANDS: 20,
        SEARCH_CACHE_SIZE: 100
    }
};

/**
 * Storage utility with expiration
 */
class CacheStorage {
    constructor(prefix = CACHE_CONFIG.PREFIX) {
        this.prefix = prefix;
    }

    set(key, value, ttl = null) {
        const item = {
            value,
            timestamp: Date.now(),
            ttl
        };
        
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(item));
        } catch (error) {
            console.warn('Cache storage failed:', error);
            this.cleanup();
        }
    }

    get(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            if (!item) return null;

            const parsed = JSON.parse(item);
            
            // Check if expired
            if (parsed.ttl && Date.now() - parsed.timestamp > parsed.ttl) {
                this.remove(key);
                return null;
            }

            return parsed.value;
        } catch (error) {
            console.warn('Cache retrieval failed:', error);
            this.remove(key);
            return null;
        }
    }

    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
        } catch (error) {
            console.warn('Cache removal failed:', error);
        }
    }

    clear() {
        try {
            Object.keys(localStorage)
                .filter(key => key.startsWith(this.prefix))
                .forEach(key => localStorage.removeItem(key));
        } catch (error) {
            console.warn('Cache clear failed:', error);
        }
    }

    cleanup() {
        try {
            // Remove expired items and oldest items if storage is full
            const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
            const items = [];

            keys.forEach(key => {
                try {
                    const item = JSON.parse(localStorage.getItem(key));
                    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
                        localStorage.removeItem(key);
                    } else {
                        items.push({ key, timestamp: item.timestamp });
                    }
                } catch (error) {
                    localStorage.removeItem(key);
                }
            });

            // If still too many items, remove oldest
            if (items.length > CACHE_CONFIG.LIMITS.SEARCH_CACHE_SIZE) {
                items.sort((a, b) => a.timestamp - b.timestamp);
                const toRemove = items.slice(0, items.length - CACHE_CONFIG.LIMITS.SEARCH_CACHE_SIZE);
                toRemove.forEach(item => localStorage.removeItem(item.key));
            }
        } catch (error) {
            console.warn('Cache cleanup failed:', error);
        }
    }
}

const cacheStorage = new CacheStorage();

/**
 * Command Cache Manager
 */
export class CommandCacheManager {
    constructor() {
        this.loadingPromises = new Map();
        this.searchCache = new Map();
    }

    // Static commands that are always available
    getStaticCommands() {
        const cached = cacheStorage.get('static_commands');
        if (cached) return cached;

        // Import commands dynamically to avoid circular deps
        const staticCommands = this.getDefaultCommands();
        cacheStorage.set('static_commands', staticCommands, CACHE_CONFIG.TTL.STATIC_COMMANDS);
        
        return staticCommands;
    }

    getDefaultCommands() {
        // Return basic commands - full command set will be loaded by useCommandCache
        // This prevents circular dependency issues
        return [
            {
                id: 'new-post',
                title: 'Create New Post',
                keywords: ['new', 'post', 'create', 'add'],
                category: 'content',
                type: 'action',
                icon: '📝',
                priority: 10
            },
            {
                id: 'new-page',
                title: 'Create New Page',
                keywords: ['new', 'page', 'create', 'add'],
                category: 'content',
                type: 'action',
                icon: '📄',
                priority: 10
            },
            {
                id: 'manage-plugins',
                title: 'Manage Plugins',
                keywords: ['plugins', 'manage', 'install', 'activate'],
                category: 'plugins',
                type: 'navigate',
                icon: '🔌',
                priority: 8
            },
            {
                id: 'customize-theme',
                title: 'Customize Theme',
                keywords: ['theme', 'customize', 'design', 'appearance'],
                category: 'settings',
                type: 'navigate',
                icon: '🎨',
                priority: 7
            }
        ];
    }

    // Set the full command set from outside
    setFullCommandSet(commands) {
        const availableCommands = commands
            .filter(cmd => !cmd.condition || cmd.condition())
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));
        
        cacheStorage.set('static_commands', availableCommands, CACHE_CONFIG.TTL.STATIC_COMMANDS);
        return availableCommands;
    }

    // Recent content that user has accessed
    async getRecentContent() {
        const cached = cacheStorage.get('recent_content');
        if (cached) return cached;

        // Load from background if not cached
        if (!this.loadingPromises.has('recent_content')) {
            this.loadingPromises.set('recent_content', this.loadRecentContent());
        }

        try {
            const recentContent = await this.loadingPromises.get('recent_content');
            cacheStorage.set('recent_content', recentContent, CACHE_CONFIG.TTL.RECENT_CONTENT);
            return recentContent;
        } catch (error) {
            console.warn('Failed to load recent content:', error);
            return [];
        } finally {
            this.loadingPromises.delete('recent_content');
        }
    }

    async loadRecentContent() {
        const [recentPosts, recentPages] = await Promise.all([
            this.fetchRecentPosts(),
            this.fetchRecentPages()
        ]);

        return [
            ...recentPosts.map(post => ({
                id: `recent-post-${post.id}`,
                title: `Edit: ${post.title}`,
                keywords: ['recent', 'post', 'edit', post.title.toLowerCase()],
                category: 'content',
                type: 'navigate',
                icon: '📝',
                priority: 9,
                data: post,
                url: `post.php?post=${post.id}&action=edit`
            })),
            ...recentPages.map(page => ({
                id: `recent-page-${page.id}`,
                title: `Edit: ${page.title}`,
                keywords: ['recent', 'page', 'edit', page.title.toLowerCase()],
                category: 'content', 
                type: 'navigate',
                icon: '📄',
                priority: 9,
                data: page,
                url: `post.php?post=${page.id}&action=edit`
            }))
        ];
    }

    async fetchRecentPosts() {
        try {
            return await apiFetch({
                path: '/wp/v2/posts',
                data: {
                    per_page: CACHE_CONFIG.LIMITS.RECENT_POSTS,
                    orderby: 'modified',
                    order: 'desc',
                    status: 'any',
                    _fields: 'id,title,modified,status,type'
                }
            });
        } catch (error) {
            console.warn('Failed to fetch recent posts:', error);
            return [];
        }
    }

    async fetchRecentPages() {
        try {
            return await apiFetch({
                path: '/wp/v2/pages',
                data: {
                    per_page: CACHE_CONFIG.LIMITS.RECENT_PAGES,
                    orderby: 'modified',
                    order: 'desc',
                    status: 'any',
                    _fields: 'id,title,modified,status,type'
                }
            });
        } catch (error) {
            console.warn('Failed to fetch recent pages:', error);
            return [];
        }
    }

    // Popular/frequently used commands
    getPopularCommands() {
        const usage = cacheStorage.get('command_usage') || {};
        const commands = this.getStaticCommands();
        
        return commands
            .map(cmd => ({
                ...cmd,
                usage: usage[cmd.id] || 0
            }))
            .sort((a, b) => b.usage - a.usage)
            .slice(0, CACHE_CONFIG.LIMITS.POPULAR_COMMANDS);
    }

    // Track command usage for popularity
    trackCommandUsage(commandId) {
        const usage = cacheStorage.get('command_usage') || {};
        usage[commandId] = (usage[commandId] || 0) + 1;
        cacheStorage.set('command_usage', usage, CACHE_CONFIG.TTL.USER_PREFERENCES);
    }

    // Get all immediately available commands
    getImmediateCommands() {
        const staticCommands = this.getStaticCommands();
        const cachedRecent = cacheStorage.get('recent_content') || [];
        const popularCommands = this.getPopularCommands();

        // Combine and deduplicate
        const allCommands = new Map();
        
        // Add static commands first (highest priority)
        staticCommands.forEach(cmd => allCommands.set(cmd.id, { ...cmd, source: 'static' }));
        
        // Add recent content (medium priority)
        cachedRecent.forEach(cmd => {
            if (!allCommands.has(cmd.id)) {
                allCommands.set(cmd.id, { ...cmd, source: 'recent' });
            }
        });

        return Array.from(allCommands.values()).sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }

    // Background loading for additional content
    async loadBackgroundContent() {
        const promises = [];

        // Load recent content if not cached
        if (!cacheStorage.get('recent_content')) {
            promises.push(this.getRecentContent());
        }

        // Load installed plugins if not cached
        if (!cacheStorage.get('installed_plugins')) {
            promises.push(this.loadInstalledPlugins());
        }

        await Promise.all(promises);
    }

    async loadInstalledPlugins() {
        try {
            const plugins = await apiFetch({
                path: '/lexia-command/v1/get-plugin-statuses'
            });

            const pluginCommands = Object.entries(plugins).map(([slug, plugin]) => ({
                id: `plugin-${slug}`,
                title: `${plugin.active ? 'Deactivate' : 'Activate'} ${plugin.name}`,
                keywords: ['plugin', plugin.name.toLowerCase(), plugin.active ? 'deactivate' : 'activate'],
                category: 'plugins',
                type: 'action',
                icon: plugin.active ? '✅' : '⚠️',
                priority: 6,
                data: { ...plugin, slug }
            }));

            cacheStorage.set('installed_plugins', pluginCommands, CACHE_CONFIG.TTL.PLUGINS);
            return pluginCommands;
        } catch (error) {
            console.warn('Failed to load installed plugins:', error);
            return [];
        }
    }

    // Search cache for performance
    getCachedSearch(query, type = 'all') {
        const cacheKey = `search_${type}_${query}`;
        return this.searchCache.get(cacheKey);
    }

    setCachedSearch(query, results, type = 'all') {
        const cacheKey = `search_${type}_${query}`;
        
        // Limit cache size
        if (this.searchCache.size >= CACHE_CONFIG.LIMITS.SEARCH_CACHE_SIZE) {
            const firstKey = this.searchCache.keys().next().value;
            this.searchCache.delete(firstKey);
        }
        
        this.searchCache.set(cacheKey, {
            results,
            timestamp: Date.now()
        });
    }

    // Get all available commands (immediate + background loaded)
    async getAllCommands() {
        const immediate = this.getImmediateCommands();
        const backgroundContent = await this.getBackgroundContent();
        
        return [...immediate, ...backgroundContent];
    }

    async getBackgroundContent() {
        const promises = [];
        
        // Get recent content
        promises.push(this.getRecentContent());
        
        // Get installed plugins
        const cachedPlugins = cacheStorage.get('installed_plugins');
        if (cachedPlugins) {
            promises.push(Promise.resolve(cachedPlugins));
        } else {
            promises.push(this.loadInstalledPlugins());
        }

        try {
            const results = await Promise.all(promises);
            return results.flat();
        } catch (error) {
            console.warn('Failed to load background content:', error);
            return [];
        }
    }

    // Clear all caches
    clearCache() {
        cacheStorage.clear();
        this.searchCache.clear();
        this.loadingPromises.clear();
    }

    // Get cache statistics
    getCacheStats() {
        return {
            localStorage: Object.keys(localStorage).filter(key => key.startsWith(CACHE_CONFIG.PREFIX)).length,
            searchCache: this.searchCache.size,
            loadingPromises: this.loadingPromises.size
        };
    }
}

// Export singleton instance
export const commandCache = new CommandCacheManager();

// Export utilities
export { cacheStorage, CACHE_CONFIG };