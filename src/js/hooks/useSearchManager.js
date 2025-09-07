import { useState, useRef, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { fuzzySearch, fuzzySearchWithHighlights } from '../utils/fuzzySearch';

/**
 * Custom hook to manage search functionality for different search types
 * @param {Object} options - Configuration options
 * @param {Function} options.onSearchComplete - Callback when search is complete
 * @returns {Object} Search manager methods and state
 */
export function useSearchManager(options = {}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    
    // Use a ref to track if we're currently loading more results
    const isLoadingMoreRef = useRef(false);
    
    // Use a debounced scroll handler to prevent too many calls
    const scrollTimerRef = useRef(null);
    
    /**
     * Reset search state
     */
    const resetSearch = useCallback(() => {
        setSearchTerm('');
        setCurrentPage(1);
        setTotalPages(0);
        setSelectedIndex(0);
    }, []);
    
    /**
     * Handle search term change
     * @param {string} term - New search term
     */
    const handleSearchTermChange = useCallback((term) => {
        setSearchTerm(term);
        setSelectedIndex(0);
    }, []);
    
    /**
     * Search WordPress plugin repository
     * @param {string} term - Search term
     * @param {number} page - Page number
     * @param {Object} pluginStatuses - Plugin statuses
     * @returns {Promise<Array>} Enhanced plugins
     */
    const searchPlugins = useCallback(async (term, page, pluginStatuses) => {
        const response = await fetch(`https://api.wordpress.org/plugins/info/1.2/?action=query_plugins&per_page=10&page=${page}&search=${encodeURIComponent(term)}`);
        const data = await response.json();
        
        // Merge plugin data with local status information
        const plugins = data.plugins || [];
        const enhancedPlugins = plugins.map(plugin => {
            const status = pluginStatuses[plugin.slug] || {};
            return {
                ...plugin,
                installed: status.installed || false,
                active: status.active || false
            };
        });
        
        setTotalPages(Math.ceil(data.info?.results || 0) / 10);
        return enhancedPlugins;
    }, []);
    
    /**
     * Search WordPress pages with fuzzy search fallback
     * @param {string} term - Search term
     * @param {Array} allPages - All pages for client-side fuzzy search (optional)
     * @returns {Promise<Array>} Pages
     */
    const searchPages = useCallback(async (term, allPages = []) => {
        // If we have all pages locally, use fuzzy search
        if (allPages.length > 0 && term) {
            const results = fuzzySearch(allPages, term, 'pages', {
                maxResults: 20,
                scoreThreshold: 0.5
            });
            return results.map(result => result.item);
        }
        
        // Otherwise use WordPress API search
        const queryString = new URLSearchParams({ 
            search: term,
            post_type: 'page',
            per_page: 20
        }).toString();
        
        const response = await apiFetch({
            path: `/wp/v2/pages?${queryString}`,
            method: 'GET'
        });
        
        return response.map(page => ({
            id: page.id,
            title: page.title.rendered || __('(No title)', 'lexia-command'),
            url: page.link,
            status: page.status
        }));
    }, []);
    
    /**
     * Perform fuzzy search on commands
     * @param {Array} commands - Array of commands to search
     * @param {string} term - Search term
     * @param {Object} options - Fuzzy search options
     * @returns {Array} Filtered and sorted commands
     */
    const fuzzySearchCommands = useCallback((commands, term, options = {}) => {
        if (!term || term.trim().length === 0) {
            return commands.map((item, index) => ({ item, refIndex: index, score: 0 }));
        }
        
        const results = fuzzySearch(commands, term, 'commands', {
            maxResults: options.maxResults || 50,
            scoreThreshold: options.scoreThreshold || 0.6,
            ...options
        });
        
        return results.map(result => result.item);
    }, []);

    /**
     * Perform fuzzy search with highlighting
     * @param {Array} data - Data to search through
     * @param {string} term - Search term
     * @param {string} type - Type of search (commands, posts, pages, plugins)
     * @param {Object} options - Search options
     * @returns {Array} Results with highlighting information
     */
    const fuzzySearchWithHighlight = useCallback((data, term, type = 'commands', options = {}) => {
        if (!term || term.trim().length === 0) {
            return data.map((item, index) => ({ 
                item, 
                refIndex: index, 
                score: 0, 
                highlights: {} 
            }));
        }
        
        return fuzzySearchWithHighlights(data, term, type, options);
    }, []);

    /**
     * Search commands and content with fuzzy matching
     * @param {string} term - Search term
     * @param {Function} searchCommandsFn - Function to search commands
     * @param {Array} allCommands - All available commands for fuzzy search
     * @returns {Promise<Array>} Search results
     */
    const searchCommandsAndContent = useCallback(async (term, searchCommandsFn, allCommands = []) => {
        // Use fuzzy search for commands if we have the full command list
        const commandResults = allCommands.length > 0 
            ? fuzzySearchCommands(allCommands, term)
            : searchCommandsFn(term);

        
        // Only return command results for command search
        if (window.lexiaCommandData.searchContext === 'commands') {
            return commandResults;
        }
        
        // For other contexts, include content results from the API
        try {
            const queryString = new URLSearchParams({ query: term }).toString();
            const response = await apiFetch({
                path: `/${window.lexiaCommandData.restNamespace}/search?${queryString}`,
                method: 'GET'
            });
            
            return [
                ...commandResults,
                ...response.data.map(item => ({
                    ...item,
                    icon: '📝',
                    action: () => {
                        window.location.href = item.url;
                    }
                }))
            ];
        } catch (error) {
            console.error('Content search API failed:', error);
            // Return just command results if API fails
            return commandResults;
        }
    }, [fuzzySearchCommands]);
    
    /**
     * Load more results for infinite scrolling
     * @param {Function} loadMoreFn - Function to load more results
     */
    const loadMore = useCallback(async (loadMoreFn) => {
        if (loadingMore || currentPage >= totalPages) {
            return;
        }
        
        // Set both state and ref to prevent race conditions
        setLoadingMore(true);
        isLoadingMoreRef.current = true;
        
        try {
            const nextPage = currentPage + 1;
            await loadMoreFn(nextPage);
            setCurrentPage(nextPage);
        } catch (error) {
            console.error('Failed to load more results:', error);
        } finally {
            setLoadingMore(false);
            // Small delay to prevent immediate re-triggering
            setTimeout(() => {
                isLoadingMoreRef.current = false;
            }, 100);
        }
    }, [loadingMore, currentPage, totalPages]);
    
    /**
     * Setup scroll handler for infinite scrolling
     * @param {boolean} isOpen - Whether the command bar is open
     * @param {boolean} shouldEnableInfiniteScroll - Whether infinite scroll should be enabled
     * @param {Function} loadMoreFn - Function to load more results
     */
    const setupScrollHandler = useCallback((isOpen, shouldEnableInfiniteScroll, loadMoreFn) => {
        if (!isOpen || !shouldEnableInfiniteScroll) {
            return () => {};
        }
        
        const handleScroll = (event) => {
            // Clear any existing timer
            if (scrollTimerRef.current) {
                clearTimeout(scrollTimerRef.current);
            }
            
            // Set a new timer to debounce scroll events
            scrollTimerRef.current = setTimeout(() => {
                const element = event.target;
                if (element.scrollHeight - element.scrollTop <= element.clientHeight * 1.5) {
                    loadMoreFn();
                }
            }, 150);
        };
        
        const resultsContainer = document.querySelector('.lexia-command-results');
        if (resultsContainer) {
            resultsContainer.addEventListener('scroll', handleScroll);
        }
        
        return () => {
            if (resultsContainer) {
                resultsContainer.removeEventListener('scroll', handleScroll);
            }
            if (scrollTimerRef.current) {
                clearTimeout(scrollTimerRef.current);
            }
        };
    }, []);
    
    /**
     * Search WordPress posts with fuzzy search fallback
     * @param {string} term - Search term
     * @param {Array} allPosts - All posts for client-side fuzzy search (optional)
     * @returns {Promise<Array>} Posts
     */
    const searchPosts = useCallback(async (term, allPosts = []) => {
        // If we have all posts locally, use fuzzy search
        if (allPosts.length > 0 && term) {
            const results = fuzzySearch(allPosts, term, 'posts', {
                maxResults: 20,
                scoreThreshold: 0.5
            });
            return results.map(result => result.item);
        }
        
        // Otherwise use WordPress API search
        const queryString = new URLSearchParams({ 
            search: term,
            post_type: 'post',
            per_page: 20
        }).toString();
        
        try {
            // Make the API request
            const response = await apiFetch({
                path: `/wp/v2/posts?${queryString}`,
                method: 'GET',
                parse: false
            });
            
            // Get total pages from headers
            const totalPosts = parseInt(response.headers.get('X-WP-Total') || 0);
            const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || 0);
            setTotalPages(totalPages);
            
            // Parse the JSON response
            const posts = await response.json();
            
            // Map the posts to a simpler format
            return posts.map(post => ({
                id: post.id,
                title: post.title.rendered || __('(No title)', 'lexia-command'),
                url: post.link,
                status: post.status,
                excerpt: post.excerpt?.rendered || '',
                content: post.content?.rendered || '',
                author: post.author || ''
            }));
        } catch (error) {
            console.error('Error fetching posts:', error);
            return [];
        }
    }, []);

    return {
        // State
        searchTerm,
        loading,
        currentPage,
        totalPages,
        loadingMore,
        selectedIndex,
        isLoadingMoreRef,
        
        // Setters
        setSearchTerm,
        setLoading,
        setCurrentPage,
        setTotalPages,
        setLoadingMore,
        setSelectedIndex,
        
        // Methods
        resetSearch,
        handleSearchTermChange,
        searchPlugins,
        searchPages,
        searchPosts,
        searchCommandsAndContent,
        loadMore,
        setupScrollHandler,
        
        // Fuzzy search methods
        fuzzySearchCommands,
        fuzzySearchWithHighlight
    };
}