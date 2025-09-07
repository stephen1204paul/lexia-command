import Fuse from 'fuse.js';

/**
 * Default Fuse.js configuration for fuzzy searching
 */
const DEFAULT_FUSE_OPTIONS = {
    // When to give up search. A threshold of 0.0 requires a perfect match, 
    // a threshold of 1.0 would match anything.
    threshold: 0.4,
    
    // Determines approximately where in the text is the pattern expected to be found
    location: 0,
    
    // Determines how close the match must be to the fuzzy location
    distance: 100,
    
    // At what point does the match algorithm give up. A threshold of 0.0 
    // requires a perfect match, a threshold of 1.0 would match anything.
    minMatchCharLength: 2,
    
    // Whether the matches should be included in the result set
    includeMatches: true,
    
    // Whether the score should be included in the result set
    includeScore: true,
    
    // Use extended search syntax
    useExtendedSearch: false,
    
    // When true, the matching function will continue to the end of a search pattern 
    // even if a perfect match has already been located in the string.
    findAllMatches: false,
    
    // List of keys to search in
    keys: [
        { name: 'title', weight: 0.7 },
        { name: 'keywords', weight: 0.5 },
        { name: 'description', weight: 0.3 },
        { name: 'category', weight: 0.2 }
    ]
};

/**
 * Configuration for different types of searches
 */
const SEARCH_CONFIGS = {
    commands: {
        ...DEFAULT_FUSE_OPTIONS,
        threshold: 0.5, // More lenient for fuzzy matching
        keys: [
            { name: 'title', weight: 0.8 },
            { name: 'keywords', weight: 0.6 },
            { name: 'description', weight: 0.3 },
            { name: 'category', weight: 0.2 }
        ]
    },
    
    posts: {
        ...DEFAULT_FUSE_OPTIONS,
        threshold: 0.4,
        keys: [
            { name: 'title', weight: 0.7 },
            { name: 'excerpt', weight: 0.4 },
            { name: 'content', weight: 0.3 },
            { name: 'author', weight: 0.2 }
        ]
    },
    
    pages: {
        ...DEFAULT_FUSE_OPTIONS,
        threshold: 0.4,
        keys: [
            { name: 'title', weight: 0.8 },
            { name: 'excerpt', weight: 0.4 },
            { name: 'content', weight: 0.3 }
        ]
    },
    
    plugins: {
        ...DEFAULT_FUSE_OPTIONS,
        threshold: 0.5, // More lenient for plugin names
        keys: [
            { name: 'name', weight: 0.8 },
            { name: 'description', weight: 0.5 },
            { name: 'author', weight: 0.2 },
            { name: 'tags', weight: 0.3 }
        ]
    },
    
    users: {
        ...DEFAULT_FUSE_OPTIONS,
        threshold: 0.3,
        keys: [
            { name: 'display_name', weight: 0.8 },
            { name: 'user_login', weight: 0.7 },
            { name: 'user_email', weight: 0.5 },
            { name: 'first_name', weight: 0.4 },
            { name: 'last_name', weight: 0.4 }
        ]
    }
};

/**
 * Cache for Fuse instances to avoid recreation
 */
const fuseCache = new Map();

/**
 * Create or get cached Fuse instance
 * @param {Array} data - Data to search through
 * @param {string} type - Type of search (commands, posts, pages, etc.)
 * @param {Object} customOptions - Custom Fuse options to override defaults
 * @returns {Fuse} Fuse instance
 */
function getFuseInstance(data, type = 'commands', customOptions = {}) {
    const cacheKey = `${type}-${data.length}-${JSON.stringify(customOptions)}`;
    
    if (fuseCache.has(cacheKey)) {
        const cachedFuse = fuseCache.get(cacheKey);
        // Update the data in case it changed
        cachedFuse.setCollection(data);
        return cachedFuse;
    }
    
    const config = {
        ...SEARCH_CONFIGS[type] || DEFAULT_FUSE_OPTIONS,
        ...customOptions
    };
    
    const fuse = new Fuse(data, config);
    
    // Cache the instance (limit cache size)
    if (fuseCache.size > 10) {
        const firstKey = fuseCache.keys().next().value;
        fuseCache.delete(firstKey);
    }
    
    fuseCache.set(cacheKey, fuse);
    return fuse;
}

/**
 * Perform fuzzy search on data
 * @param {Array} data - Array of objects to search through
 * @param {string} query - Search query
 * @param {string} type - Type of search (commands, posts, pages, etc.)
 * @param {Object} options - Additional options
 * @returns {Array} Filtered and sorted results
 */
export function fuzzySearch(data, query, type = 'commands', options = {}) {
    // Return all data if no query
    if (!query || query.trim().length === 0) {
        return data.map((item, index) => ({
            item,
            refIndex: index,
            score: 0
        }));
    }
    
    // Get configuration for this search type
    const {
        maxResults = 50,
        customFuseOptions = {},
        scoreThreshold = null,
        ...otherOptions
    } = options;
    
    // Create or get Fuse instance
    const fuse = getFuseInstance(data, type, customFuseOptions);
    
    // Perform the search
    const results = fuse.search(query, {
        limit: maxResults,
        ...otherOptions
    });
    
    // Filter by score threshold if provided
    const filteredResults = scoreThreshold 
        ? results.filter(result => result.score <= scoreThreshold)
        : results;
    
    return filteredResults;
}

/**
 * Enhanced fuzzy search with result highlighting
 * @param {Array} data - Array of objects to search through
 * @param {string} query - Search query
 * @param {string} type - Type of search
 * @param {Object} options - Additional options
 * @returns {Array} Results with highlighting information
 */
export function fuzzySearchWithHighlights(data, query, type = 'commands', options = {}) {
    const results = fuzzySearch(data, query, type, {
        ...options,
        customFuseOptions: {
            ...options.customFuseOptions,
            includeMatches: true
        }
    });
    
    return results.map(result => {
        const highlights = {};
        
        // Extract highlights from matches
        if (result.matches) {
            result.matches.forEach(match => {
                const key = match.key;
                highlights[key] = match.indices || [];
            });
        }
        
        return {
            ...result,
            highlights
        };
    });
}

/**
 * Get search suggestions based on partial query
 * @param {Array} data - Array of objects to search through
 * @param {string} partialQuery - Partial search query
 * @param {string} type - Type of search
 * @param {number} maxSuggestions - Maximum number of suggestions
 * @returns {Array} Suggested search terms
 */
export function getSearchSuggestions(data, partialQuery, type = 'commands', maxSuggestions = 5) {
    if (!partialQuery || partialQuery.length < 2) {
        return [];
    }
    
    const fuse = getFuseInstance(data, type, {
        threshold: 0.6, // More lenient for suggestions
        minMatchCharLength: 1
    });
    
    const results = fuse.search(partialQuery, { limit: maxSuggestions * 2 });
    
    // Extract unique suggestions from the results
    const suggestions = new Set();
    
    results.forEach(result => {
        if (result.matches) {
            result.matches.forEach(match => {
                const value = match.value;
                if (value && typeof value === 'string') {
                    // Extract words that contain the partial query
                    const words = value.toLowerCase().split(/\s+/);
                    words.forEach(word => {
                        if (word.includes(partialQuery.toLowerCase()) && word !== partialQuery.toLowerCase()) {
                            suggestions.add(word);
                        }
                    });
                }
            });
        }
    });
    
    return Array.from(suggestions).slice(0, maxSuggestions);
}

/**
 * Clear the Fuse cache (useful for testing or memory management)
 */
export function clearFuseCache() {
    fuseCache.clear();
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
export function getCacheStats() {
    return {
        size: fuseCache.size,
        keys: Array.from(fuseCache.keys())
    };
}

/**
 * Utility function to highlight matched text
 * @param {string} text - Original text
 * @param {Array} indices - Array of [start, end] indices to highlight
 * @param {string} highlightClass - CSS class for highlighted text
 * @returns {string} HTML string with highlighted text
 */
export function highlightMatches(text, indices = [], highlightClass = 'fuzzy-match') {
    if (!indices.length) {
        return text;
    }
    
    let highlightedText = '';
    let lastIndex = 0;
    
    // Sort indices by start position
    const sortedIndices = indices.sort((a, b) => a[0] - b[0]);
    
    // Merge overlapping indices
    const mergedIndices = [];
    let currentRange = sortedIndices[0];
    
    for (let i = 1; i < sortedIndices.length; i++) {
        const [start, end] = sortedIndices[i];
        
        // If current range overlaps with next range, merge them
        if (start <= currentRange[1] + 1) {
            currentRange[1] = Math.max(currentRange[1], end);
        } else {
            mergedIndices.push(currentRange);
            currentRange = [start, end];
        }
    }
    mergedIndices.push(currentRange);
    
    mergedIndices.forEach(([start, end]) => {
        // Add text before highlight
        highlightedText += text.slice(lastIndex, start);
        
        // Add highlighted text
        highlightedText += `<span class="${highlightClass}">`;
        highlightedText += text.slice(start, end + 1);
        highlightedText += '</span>';
        
        lastIndex = end + 1;
    });
    
    // Add remaining text
    highlightedText += text.slice(lastIndex);
    
    return highlightedText;
}

/**
 * Export configurations for testing/debugging
 */
export { SEARCH_CONFIGS, DEFAULT_FUSE_OPTIONS };