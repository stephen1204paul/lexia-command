/**
 * useCommandCache Hook
 * Provides Raycast-style command loading with instant static commands,
 * background loading for dynamic content, and intelligent caching
 */

import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import { commandCache } from '../utils/commandCache';
import { fuzzySearch } from '../utils/fuzzySearch';
import { commands } from '../commands';

/**
 * Performance monitoring
 */
const PERFORMANCE_THRESHOLDS = {
    IMMEDIATE_LOAD: 50,    // Static commands should load in <50ms
    BACKGROUND_LOAD: 500,  // Background content should load in <500ms
    SEARCH_RESPONSE: 100   // Search should respond in <100ms
};

const performanceLog = (operation, startTime, data = {}) => {
    const duration = performance.now() - startTime;
    const isSlowOperation = duration > PERFORMANCE_THRESHOLDS[operation.toUpperCase()];
    
    console.log(`⚡ ${operation}: ${duration.toFixed(1)}ms${isSlowOperation ? ' ⚠️ SLOW' : ''}`, data);
    
    return duration;
};

/**
 * Command loading phases
 */
const LOADING_PHASES = {
    INITIAL: 'initial',      // Loading static commands
    BACKGROUND: 'background', // Loading background content
    COMPLETE: 'complete',    // All content loaded
    SEARCH: 'search'         // Searching specific content
};

/**
 * useCommandCache Hook
 */
export function useCommandCache() {
    const [commands, setCommands] = useState([]);
    const [loadingPhase, setLoadingPhase] = useState(LOADING_PHASES.INITIAL);
    const [backgroundCommands, setBackgroundCommands] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [cacheStats, setCacheStats] = useState({ hits: 0, misses: 0 });

    const searchTimeoutRef = useRef(null);
    const backgroundLoadingRef = useRef(false);
    const performanceRef = useRef({
        loadTimes: {},
        searchTimes: []
    });

    /**
     * Load immediate commands (static + cached)
     */
    const loadImmediateCommands = useCallback(async () => {
        const startTime = performance.now();
        
        try {
            // First, set the full command set in the cache
            commandCache.setFullCommandSet(commands);
            
            const immediateCommands = commandCache.getImmediateCommands();
            setCommands(immediateCommands);
            setLoadingPhase(LOADING_PHASES.BACKGROUND);
            
            const duration = performanceLog('immediate_load', startTime, { 
                commandCount: immediateCommands.length 
            });
            
            performanceRef.current.loadTimes.immediate = duration;
            
            return immediateCommands;
        } catch (error) {
            console.error('Failed to load immediate commands:', error);
            setCommands([]);
            return [];
        }
    }, []);

    /**
     * Load background content
     */
    const loadBackgroundContent = useCallback(async () => {
        if (backgroundLoadingRef.current) return;
        backgroundLoadingRef.current = true;

        const startTime = performance.now();
        
        try {
            // Start background loading
            commandCache.loadBackgroundContent();
            
            // Get any immediately available background content
            const backgroundContent = await commandCache.getBackgroundContent();
            setBackgroundCommands(backgroundContent);
            
            const duration = performanceLog('background_load', startTime, { 
                backgroundCount: backgroundContent.length 
            });
            
            performanceRef.current.loadTimes.background = duration;
            setLoadingPhase(LOADING_PHASES.COMPLETE);
            
        } catch (error) {
            console.error('Failed to load background content:', error);
        } finally {
            backgroundLoadingRef.current = false;
        }
    }, []);

    /**
     * Get all available commands
     */
    const getAllCommands = useCallback(() => {
        const allCommands = [...commands, ...backgroundCommands];
        
        // Remove duplicates by ID
        const uniqueCommands = allCommands.reduce((acc, cmd) => {
            if (!acc.find(existing => existing.id === cmd.id)) {
                acc.push(cmd);
            }
            return acc;
        }, []);

        return uniqueCommands.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }, [commands, backgroundCommands]);

    /**
     * Perform search with caching and progressive enhancement
     */
    const searchCommands = useCallback(async (query, options = {}) => {
        const startTime = performance.now();
        setSearchQuery(query);
        
        // Clear previous search timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // If empty query, return top commands
        if (!query || query.trim().length === 0) {
            const topCommands = getAllCommands().slice(0, 10);
            setSearchResults(topCommands);
            setIsSearching(false);
            return topCommands;
        }

        setIsSearching(true);
        
        try {
            // Check search cache first
            const cached = commandCache.getCachedSearch(query, options.type);
            if (cached && Date.now() - cached.timestamp < 30000) { // 30 second cache
                setSearchResults(cached.results);
                setIsSearching(false);
                setCacheStats(prev => ({ ...prev, hits: prev.hits + 1 }));
                
                performanceLog('search_response', startTime, { 
                    query, 
                    resultCount: cached.results.length,
                    source: 'cache'
                });
                
                return cached.results;
            }

            setCacheStats(prev => ({ ...prev, misses: prev.misses + 1 }));

            // Search in available commands first (immediate response)
            const availableCommands = getAllCommands();
            const immediateResults = fuzzySearch(availableCommands, query, 'commands', {
                maxResults: options.maxResults || 20
            });

            setSearchResults(immediateResults.map(result => result.item));

            // If query is long enough, search additional content
            if (query.length >= 3) {
                searchTimeoutRef.current = setTimeout(async () => {
                    await searchExpandedContent(query, options);
                }, 150); // Debounce expanded search
            }

            const searchDuration = performanceLog('search_response', startTime, { 
                query, 
                resultCount: immediateResults.length,
                source: 'immediate'
            });
            
            performanceRef.current.searchTimes.push(searchDuration);
            
            // Cache the results
            commandCache.setCachedSearch(query, immediateResults.map(result => result.item), options.type);
            
            setIsSearching(false);
            return immediateResults.map(result => result.item);
            
        } catch (error) {
            console.error('Search failed:', error);
            setIsSearching(false);
            return [];
        }
    }, [getAllCommands]);

    /**
     * Search expanded content (posts, pages, etc.)
     */
    const searchExpandedContent = useCallback(async (query, options = {}) => {
        setLoadingPhase(LOADING_PHASES.SEARCH);
        
        try {
            // This would search all posts/pages/etc via API
            // For now, we'll use the available background content
            const allContent = await commandCache.getAllCommands();
            const expandedResults = fuzzySearch(allContent, query, 'commands', {
                maxResults: options.maxResults || 50
            });

            // Merge with existing results, removing duplicates
            setSearchResults(prevResults => {
                const combined = [...prevResults];
                expandedResults.forEach(result => {
                    if (!combined.find(existing => existing.id === result.item.id)) {
                        combined.push(result.item);
                    }
                });
                return combined.slice(0, options.maxResults || 50);
            });

        } catch (error) {
            console.error('Expanded search failed:', error);
        } finally {
            setLoadingPhase(LOADING_PHASES.COMPLETE);
        }
    }, []);

    /**
     * Track command usage for popularity
     */
    const trackCommandUsage = useCallback((commandId) => {
        commandCache.trackCommandUsage(commandId);
    }, []);

    /**
     * Clear all caches
     */
    const clearCache = useCallback(() => {
        commandCache.clearCache();
        setCommands([]);
        setBackgroundCommands([]);
        setSearchResults([]);
        setSearchQuery('');
        setCacheStats({ hits: 0, misses: 0 });
        performanceRef.current = { loadTimes: {}, searchTimes: [] };
    }, []);

    /**
     * Get performance metrics
     */
    const getPerformanceMetrics = useCallback(() => {
        const searchTimes = performanceRef.current.searchTimes;
        return {
            loadTimes: performanceRef.current.loadTimes,
            averageSearchTime: searchTimes.length > 0 
                ? searchTimes.reduce((sum, time) => sum + time, 0) / searchTimes.length 
                : 0,
            searchCount: searchTimes.length,
            cacheHitRate: cacheStats.hits + cacheStats.misses > 0 
                ? (cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100).toFixed(1) + '%'
                : '0%',
            cacheStats: commandCache.getCacheStats()
        };
    }, [cacheStats]);

    /**
     * Initialize on mount
     */
    useEffect(() => {
        const initialize = async () => {
            await loadImmediateCommands();
            // Start background loading after immediate commands are loaded
            setTimeout(() => {
                loadBackgroundContent();
            }, 100);
        };

        initialize();
    }, [loadImmediateCommands, loadBackgroundContent]);

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    return {
        // Command data
        commands: searchQuery ? searchResults : getAllCommands(),
        immediateCommands: commands,
        backgroundCommands,
        searchResults,
        
        // State
        loadingPhase,
        isSearching,
        searchQuery,
        
        // Actions
        searchCommands,
        trackCommandUsage,
        clearCache,
        
        // Utilities
        getPerformanceMetrics,
        cacheStats: {
            ...cacheStats,
            ...commandCache.getCacheStats()
        },
        
        // Computed values
        isReady: loadingPhase !== LOADING_PHASES.INITIAL,
        hasBackgroundContent: backgroundCommands.length > 0,
        totalCommands: getAllCommands().length
    };
}

export default useCommandCache;