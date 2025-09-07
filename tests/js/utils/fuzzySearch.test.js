/**
 * @jest-environment jsdom
 */
import { fuzzySearch, fuzzySearchWithHighlights, getSearchSuggestions, highlightMatches, clearFuseCache } from '../../../src/js/utils/fuzzySearch';

// Mock data for testing
const mockCommands = [
    {
        id: 'create-page',
        title: 'Create a new page',
        description: 'Create a new static page for your website',
        keywords: ['new page', 'add page', 'create page', 'static page'],
        category: 'CONTENT'
    },
    {
        id: 'create-post',
        title: 'Create a new post',
        description: 'Create a new blog post or article',
        keywords: ['new post', 'add post', 'create post', 'write', 'blog', 'article'],
        category: 'CONTENT'
    },
    {
        id: 'media-library',
        title: 'Open Media Library',
        description: 'Manage uploads, images, videos and other media files',
        keywords: ['media', 'images', 'library', 'files', 'uploads', 'videos', 'photos'],
        category: 'CONTENT'
    },
    {
        id: 'settings',
        title: 'Site Settings',
        description: 'Configure general site settings and options',
        keywords: ['settings', 'options', 'configure', 'general', 'site config'],
        category: 'SETTINGS'
    },
    {
        id: 'customize',
        title: 'Customize Theme',
        description: 'Customize your theme appearance, colors, and layout',
        keywords: ['customize', 'theme', 'appearance', 'customizer', 'design', 'style', 'themes', 'colors'],
        category: 'SETTINGS'
    }
];

describe('Fuzzy Search', () => {
    beforeEach(() => {
        clearFuseCache();
    });
    
    describe('fuzzySearch', () => {
        it('should return all items when no query is provided', () => {
            const results = fuzzySearch(mockCommands, '');
            expect(results).toHaveLength(5);
            expect(results[0]).toHaveProperty('item');
            expect(results[0]).toHaveProperty('refIndex');
            expect(results[0]).toHaveProperty('score', 0);
        });
        
        it('should find exact matches', () => {
            const results = fuzzySearch(mockCommands, 'Create a new page');
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].item.id).toBe('create-page');
            expect(results[0].score).toBeLessThan(0.1); // Should be very close match
        });
        
        it('should find partial matches', () => {
            const results = fuzzySearch(mockCommands, 'page');
            expect(results.length).toBeGreaterThan(0);
            
            // Should find both "create page" and items with "page" in keywords
            const ids = results.map(r => r.item.id);
            expect(ids).toContain('create-page');
        });
        
        it('should find fuzzy matches', () => {
            const results = fuzzySearch(mockCommands, 'meda'); // Typo for "media"
            expect(results.length).toBeGreaterThan(0);
            
            const ids = results.map(r => r.item.id);
            expect(ids).toContain('media-library');
        });
        
        it('should search in keywords', () => {
            const results = fuzzySearch(mockCommands, 'blog');
            expect(results.length).toBeGreaterThan(0);
            
            const ids = results.map(r => r.item.id);
            expect(ids).toContain('create-post');
        });
        
        it('should search in descriptions', () => {
            const results = fuzzySearch(mockCommands, 'uploads');
            expect(results.length).toBeGreaterThan(0);
            
            const ids = results.map(r => r.item.id);
            expect(ids).toContain('media-library');
        });
        
        it('should search in categories', () => {
            const results = fuzzySearch(mockCommands, 'CONTENT');
            expect(results.length).toBe(3); // create-page, create-post, media-library
            
            const ids = results.map(r => r.item.id);
            expect(ids).toContain('create-page');
            expect(ids).toContain('create-post');
            expect(ids).toContain('media-library');
        });
        
        it('should limit results when maxResults is specified', () => {
            const results = fuzzySearch(mockCommands, 'create', 'commands', {
                maxResults: 1
            });
            expect(results).toHaveLength(1);
        });
        
        it('should filter by score threshold', () => {
            const results = fuzzySearch(mockCommands, 'xyz123', 'commands', {
                scoreThreshold: 0.3
            });
            expect(results).toHaveLength(0); // No good matches for random string
        });
    });
    
    describe('fuzzySearchWithHighlights', () => {
        it('should return results with highlight information', () => {
            const results = fuzzySearchWithHighlights(mockCommands, 'page');
            expect(results.length).toBeGreaterThan(0);
            expect(results[0]).toHaveProperty('highlights');
        });
        
        it('should include match indices in highlights', () => {
            const results = fuzzySearchWithHighlights(mockCommands, 'Create');
            expect(results.length).toBeGreaterThan(0);
            
            const result = results.find(r => r.item.id === 'create-page');
            expect(result).toBeDefined();
            expect(result.highlights).toBeDefined();
        });
    });
    
    describe('getSearchSuggestions', () => {
        it('should return suggestions for partial queries', () => {
            const suggestions = getSearchSuggestions(mockCommands, 'cr', 'commands', 3);
            expect(Array.isArray(suggestions)).toBe(true);
            expect(suggestions.length).toBeLessThanOrEqual(3);
        });
        
        it('should return empty array for very short queries', () => {
            const suggestions = getSearchSuggestions(mockCommands, 'c');
            expect(suggestions).toEqual([]);
        });
        
        it('should return unique suggestions', () => {
            const suggestions = getSearchSuggestions(mockCommands, 'cr');
            const uniqueSuggestions = [...new Set(suggestions)];
            expect(suggestions).toEqual(uniqueSuggestions);
        });
    });
    
    describe('highlightMatches', () => {
        it('should return original text when no indices provided', () => {
            const result = highlightMatches('Hello World');
            expect(result).toBe('Hello World');
        });
        
        it('should highlight matching text with default class', () => {
            const result = highlightMatches('Hello World', [[0, 4]]);
            expect(result).toBe('<span class="fuzzy-match">Hello</span> World');
        });
        
        it('should highlight with custom class', () => {
            const result = highlightMatches('Hello World', [[6, 10]], 'custom-highlight');
            expect(result).toBe('Hello <span class="custom-highlight">World</span>');
        });
        
        it('should handle multiple highlight ranges', () => {
            const result = highlightMatches('Hello Beautiful World', [[0, 4], [16, 20]]);
            expect(result).toBe('<span class="fuzzy-match">Hello</span> Beautiful <span class="fuzzy-match">World</span>');
        });
    });
    
    describe('Different search types', () => {
        const mockPosts = [
            {
                id: 1,
                title: 'My First Blog Post',
                excerpt: 'This is an excerpt',
                content: 'Full content here',
                author: 'John Doe'
            }
        ];
        
        it('should work with posts search type', () => {
            const results = fuzzySearch(mockPosts, 'blog', 'posts');
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].item.id).toBe(1);
        });
        
        const mockPlugins = [
            {
                name: 'Contact Form 7',
                description: 'Simple contact form plugin',
                author: 'Takayuki Miyoshi',
                tags: ['contact', 'form', 'email']
            }
        ];
        
        it('should work with plugins search type', () => {
            const results = fuzzySearch(mockPlugins, 'contact', 'plugins');
            expect(results.length).toBeGreaterThan(0);
        });
    });
    
    describe('Performance and caching', () => {
        it('should cache Fuse instances', () => {
            // First search
            const results1 = fuzzySearch(mockCommands, 'page');
            expect(results1.length).toBeGreaterThan(0);
            
            // Second search with same data should use cache
            const results2 = fuzzySearch(mockCommands, 'post');
            expect(results2.length).toBeGreaterThan(0);
        });
        
        it('should clear cache when requested', () => {
            fuzzySearch(mockCommands, 'test');
            clearFuseCache();
            // Cache should be empty now - no direct way to test but should not throw
            expect(() => clearFuseCache()).not.toThrow();
        });
    });
});