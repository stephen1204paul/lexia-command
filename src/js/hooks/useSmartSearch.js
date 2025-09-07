/**
 * useSmartSearch Hook
 * Provides intelligent search with progressive enhancement,
 * predictive loading, and performance optimization similar to modern command palettes
 */

import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import { useCommandCache } from './useCommandCache';
import { fuzzySearch, fuzzySearchWithHighlights } from '../utils/fuzzySearch';
import apiFetch from '@wordpress/api-fetch';

// Search configuration
const SEARCH_CONFIG = {
    DEBOUNCE_DELAY: 150,           // ms to wait before searching
    MIN_QUERY_LENGTH: 1,           // Minimum characters to trigger search
    EXPANDED_SEARCH_LENGTH: 3,     // Characters to trigger expanded search
    MAX_IMMEDIATE_RESULTS: 10,     // Results to show immediately
    MAX_EXPANDED_RESULTS: 50,      // Maximum results after expansion
    CACHE_TTL: 5 * 60 * 1000,     // 5 minutes cache for search results
    PREDICTIVE_THRESHOLD: 2        // Characters to start predictive loading
};

// Search categories with different behaviors
const SEARCH_CATEGORIES = {
    COMMANDS: 'commands',
    CONTENT: 'content',
    PLUGINS: 'plugins',
    USERS: 'users',
    ALL: 'all'
};

/**
 * Search result scoring and ranking
 */
const calculateRelevanceScore = (result, query, category = 'all') => {
    let score = result.score || 0;
    
    // Boost exact title matches
    if (result.item.title?.toLowerCase().includes(query.toLowerCase())) {
        score *= 0.8; // Lower score = higher relevance in Fuse.js
    }
    
    // Boost recent items
    if (result.item.source === 'recent') {
        score *= 0.9;
    }
    
    // Boost frequently used commands
    if (result.item.usage > 0) {
        score *= Math.max(0.7, 1 - (result.item.usage * 0.1));
    }
    
    // Category-specific boosts
    if (category !== 'all' && result.item.category === category) {
        score *= 0.85;
    }
    
    return score;
};

/**
 * Search result grouping and organization
 */
const organizeResults = (results, query, options = {}) => {
    const { groupByCategory = false, maxPerCategory = 10 } = options;
    
    if (!groupByCategory) {
        return results.slice(0, SEARCH_CONFIG.MAX_EXPANDED_RESULTS);
    }
    
    const grouped = results.reduce((acc, result) => {
        const category = result.item.category || 'other';
        if (!acc[category]) acc[category] = [];
        if (acc[category].length < maxPerCategory) {
            acc[category].push(result);
        }
        return acc;
    }, {});
    
    // Prioritize categories based on query
    const categoryPriority = ['commands', 'content', 'plugins', 'users', 'other'];
    const organized = [];
    
    categoryPriority.forEach(category => {
        if (grouped[category]) {
            organized.push(...grouped[category]);
        }
    });
    
    return organized.slice(0, SEARCH_CONFIG.MAX_EXPANDED_RESULTS);
};

/**
 * Predictive content loading
 */
const usePredictiveLoading = () => {
    const predictiveCache = useRef(new Map());
    const loadingQueue = useRef(new Set());
    
    const predictiveLoad = useCallback(async (partialQuery) => {
        if (partialQuery.length < SEARCH_CONFIG.PREDICTIVE_THRESHOLD) return;
        
        // Generate likely completions
        const possibleQueries = [
            partialQuery + 'e',
            partialQuery + 's',
            partialQuery + 'ing',
            // Add more sophisticated prediction logic here
        ];
        
        possibleQueries.forEach(async (query) => {
            if (!predictiveCache.current.has(query) && !loadingQueue.current.has(query)) {
                loadingQueue.current.add(query);
                
                try {
                    // Pre-load search results for likely queries
                    const results = await performExpandedSearch(query);
                    predictiveCache.current.set(query, {
                        results,
                        timestamp: Date.now()
                    });
                } catch (error) {
                    console.warn('Predictive loading failed:', error);
                } finally {
                    loadingQueue.current.delete(query);
                }
            }
        });
    }, []);
    
    const getPredictiveResults = useCallback((query) => {
        const cached = predictiveCache.current.get(query);
        if (cached && Date.now() - cached.timestamp < SEARCH_CONFIG.CACHE_TTL) {
            return cached.results;
        }
        return null;
    }, []);
    
    return { predictiveLoad, getPredictiveResults };
};

/**
 * Expanded search for comprehensive results
 */
const performExpandedSearch = async (query, category = 'all') => {
    const searches = [];
    
    // Search posts if content category or all
    if (category === SEARCH_CATEGORIES.CONTENT || category === SEARCH_CATEGORIES.ALL) {
        searches.push(
            apiFetch({
                path: '/wp/v2/posts',
                data: {
                    search: query,
                    per_page: 20,
                    _fields: 'id,title,excerpt,modified,status,type'
                }
            }).then(posts => posts.map(post => ({
                id: `post-${post.id}`,
                title: post.title.rendered,
                excerpt: post.excerpt?.rendered,
                category: 'content',
                type: 'navigate',
                icon: '📝',
                priority: 6,
                data: post,
                url: `post.php?post=${post.id}&action=edit`
            }))).catch(() => [])
        );
    }
    
    // Search pages if content category or all
    if (category === SEARCH_CATEGORIES.CONTENT || category === SEARCH_CATEGORIES.ALL) {
        searches.push(
            apiFetch({
                path: '/wp/v2/pages',
                data: {
                    search: query,
                    per_page: 10,
                    _fields: 'id,title,excerpt,modified,status,type'
                }
            }).then(pages => pages.map(page => ({
                id: `page-${page.id}`,
                title: page.title.rendered,
                excerpt: page.excerpt?.rendered,
                category: 'content',
                type: 'navigate',
                icon: '📄',
                priority: 7,
                data: page,
                url: `post.php?post=${page.id}&action=edit`
            }))).catch(() => [])
        );
    }
    
    // Search plugins if plugins category or all
    if (category === SEARCH_CATEGORIES.PLUGINS || category === SEARCH_CATEGORIES.ALL) {
        searches.push(
            apiFetch({
                path: '/lexia-command/v1/search',
                data: {
                    type: 'plugins',
                    search: query,
                    per_page: 15
                }
            }).then(plugins => plugins.map(plugin => ({
                id: `plugin-search-${plugin.slug}`,
                title: plugin.name,
                description: plugin.short_description,
                category: 'plugins',
                type: 'action',
                icon: '🔌',
                priority: 5,
                data: plugin
            }))).catch(() => [])
        );
    }
    
    const results = await Promise.all(searches);
    return results.flat();
};

/**
 * Main useSmartSearch hook
 */
export function useSmartSearch(options = {}) {
    const { 
        category = SEARCH_CATEGORIES.ALL,
        enablePredictive = true,
        enableHighlights = false,
        groupResults = false
    } = options;
    
    const commandCache = useCommandCache();
    const [searchState, setSearchState] = useState({
        query: '',
        results: [],
        isSearching: false,
        hasMore: false,
        searchTime: 0,
        resultCount: 0
    });
    
    const [expandedResults, setExpandedResults] = useState([]);
    const [isExpanding, setIsExpanding] = useState(false);
    
    const searchTimeoutRef = useRef(null);
    const expandedSearchRef = useRef(null);
    const { predictiveLoad, getPredictiveResults } = usePredictiveLoading();
    
    /**
     * Immediate search in cached commands
     */
    const performImmediateSearch = useCallback((query) => {
        const startTime = performance.now();
        
        if (!query || query.trim().length === 0) {
            const topCommands = commandCache.commands.slice(0, SEARCH_CONFIG.MAX_IMMEDIATE_RESULTS);
            return topCommands;
        }
        
        // Use fuzzy search with highlights if enabled
        const searchFunction = enableHighlights ? fuzzySearchWithHighlights : fuzzySearch;
        
        const results = searchFunction(
            commandCache.commands, 
            query, 
            'commands',
            {
                maxResults: SEARCH_CONFIG.MAX_IMMEDIATE_RESULTS,
                scoreThreshold: 0.8
            }
        );
        
        // Calculate relevance scores and sort
        const scoredResults = results.map(result => ({
            ...result,
            relevanceScore: calculateRelevanceScore(result, query, category)
        })).sort((a, b) => a.relevanceScore - b.relevanceScore);
        
        const searchTime = performance.now() - startTime;
        console.log(`🔍 Immediate search: ${searchTime.toFixed(1)}ms, ${scoredResults.length} results`);
        
        return scoredResults.map(result => enableHighlights ? result : result.item);
    }, [commandCache.commands, category, enableHighlights]);
    
    /**
     * Expanded search with API calls
     */
    const performExpandedSearchInternal = useCallback(async (query) => {
        if (query.length < SEARCH_CONFIG.EXPANDED_SEARCH_LENGTH) return [];
        
        setIsExpanding(true);
        const startTime = performance.now();
        
        try {
            // Check predictive cache first
            if (enablePredictive) {
                const predictiveResults = getPredictiveResults(query);
                if (predictiveResults) {
                    console.log('📋 Using predictive results for:', query);
                    return predictiveResults;
                }
            }
            
            const expandedResults = await performExpandedSearch(query, category);
            const searchTime = performance.now() - startTime;
            
            console.log(`🔍 Expanded search: ${searchTime.toFixed(1)}ms, ${expandedResults.length} results`);
            
            return expandedResults;
        } catch (error) {
            console.error('Expanded search failed:', error);
            return [];
        } finally {
            setIsExpanding(false);
        }
    }, [category, enablePredictive, getPredictiveResults]);
    
    /**
     * Main search function
     */
    const search = useCallback(async (query) => {
        const trimmedQuery = query.trim();
        
        setSearchState(prev => ({
            ...prev,
            query: trimmedQuery,
            isSearching: true
        }));
        
        // Clear previous timeouts
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        if (expandedSearchRef.current) {
            clearTimeout(expandedSearchRef.current);
        }
        
        const startTime = performance.now();
        
        try {
            // Immediate search in cached commands
            const immediateResults = performImmediateSearch(trimmedQuery);
            
            setSearchState(prev => ({
                ...prev,
                results: immediateResults,
                resultCount: immediateResults.length,
                searchTime: performance.now() - startTime,
                isSearching: trimmedQuery.length >= SEARCH_CONFIG.EXPANDED_SEARCH_LENGTH
            }));
            
            // Start predictive loading for next likely queries
            if (enablePredictive && trimmedQuery.length >= SEARCH_CONFIG.PREDICTIVE_THRESHOLD) {
                predictiveLoad(trimmedQuery);
            }
            
            // Debounced expanded search for longer queries
            if (trimmedQuery.length >= SEARCH_CONFIG.EXPANDED_SEARCH_LENGTH) {
                expandedSearchRef.current = setTimeout(async () => {
                    const expanded = await performExpandedSearchInternal(trimmedQuery);
                    
                    setExpandedResults(expanded);
                    setSearchState(prev => ({
                        ...prev,
                        isSearching: false,
                        hasMore: expanded.length > 0,
                        resultCount: prev.resultCount + expanded.length,
                        searchTime: performance.now() - startTime
                    }));
                }, SEARCH_CONFIG.DEBOUNCE_DELAY);
            } else {
                setExpandedResults([]);
                setSearchState(prev => ({
                    ...prev,
                    isSearching: false,
                    hasMore: false
                }));
            }
            
        } catch (error) {
            console.error('Search failed:', error);
            setSearchState(prev => ({
                ...prev,
                isSearching: false,
                results: [],
                resultCount: 0,
                hasMore: false
            }));
        }
    }, [performImmediateSearch, performExpandedSearchInternal, enablePredictive, predictiveLoad]);
    
    /**
     * Get all results combined
     */
    const getAllResults = useCallback(() => {
        const combined = [...searchState.results, ...expandedResults];
        
        if (groupResults) {
            return organizeResults(combined.map(item => ({ item })), searchState.query, {
                groupByCategory: true,
                maxPerCategory: 10
            }).map(result => result.item);
        }
        
        return combined.slice(0, SEARCH_CONFIG.MAX_EXPANDED_RESULTS);
    }, [searchState.results, expandedResults, searchState.query, groupResults]);
    
    /**
     * Clear search
     */
    const clearSearch = useCallback(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        if (expandedSearchRef.current) {
            clearTimeout(expandedSearchRef.current);
        }
        
        setSearchState({
            query: '',
            results: [],
            isSearching: false,
            hasMore: false,
            searchTime: 0,
            resultCount: 0
        });
        setExpandedResults([]);
    }, []);
    
    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            if (expandedSearchRef.current) {
                clearTimeout(expandedSearchRef.current);
            }
        };
    }, []);
    
    return {
        // Search state
        query: searchState.query,
        results: getAllResults(),
        immediateResults: searchState.results,
        expandedResults,
        isSearching: searchState.isSearching || isExpanding,
        hasMore: searchState.hasMore,
        
        // Actions
        search,
        clearSearch,
        
        // Performance metrics
        searchTime: searchState.searchTime,
        resultCount: searchState.resultCount,
        
        // Utilities
        performanceMetrics: {
            ...commandCache.getPerformanceMetrics(),
            lastSearchTime: searchState.searchTime,
            totalResults: searchState.resultCount
        }
    };
}

export default useSmartSearch;
export { SEARCH_CATEGORIES, SEARCH_CONFIG };