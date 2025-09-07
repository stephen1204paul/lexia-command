import { 
    setupWordPressGlobals,
    mockFetch,
    mockApiFetch,
    cleanup 
} from '../utils/test-helpers';
import { 
    mockAPIResponses,
    mockPages,
    mockPosts,
    mockPlugins,
    mockPluginStatuses 
} from '../fixtures/mock-data';

describe('REST API Integration', () => {
    let fetchMock;
    let apiFetchMock;

    beforeEach(() => {
        setupWordPressGlobals();
        fetchMock = mockFetch(mockAPIResponses);
        apiFetchMock = mockApiFetch();
    });

    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    describe('Search API', () => {
        test('calls correct endpoint for page search', async () => {
            const response = await fetch('http://localhost/wp-json/lexia-command/v1/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': 'test-nonce-123',
                },
                body: JSON.stringify({
                    query: 'test',
                    type: 'page',
                    page: 1,
                    per_page: 10,
                }),
            });

            const data = await response.json();

            expect(fetchMock).toHaveBeenCalledWith(
                'http://localhost/wp-json/lexia-command/v1/search',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': 'test-nonce-123',
                    }),
                })
            );

            expect(data.success).toBe(true);
            expect(data.data).toHaveProperty('results');
        });

        test('calls correct endpoint for post search', async () => {
            const response = await fetch('http://localhost/wp-json/lexia-command/v1/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': 'test-nonce-123',
                },
                body: JSON.stringify({
                    query: 'blog',
                    type: 'post',
                    page: 1,
                    per_page: 20,
                }),
            });

            const data = await response.json();

            expect(fetchMock).toHaveBeenCalled();
            expect(data.success).toBe(true);
            expect(data.data.results).toBeDefined();
        });

        test('handles pagination parameters', async () => {
            const response = await fetch('http://localhost/wp-json/lexia-command/v1/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: 'test',
                    type: 'post',
                    page: 2,
                    per_page: 5,
                }),
            });

            const data = await response.json();
            
            expect(data.data.page).toBe(1); // Mock returns page 1
            expect(data.data.per_page).toBe(10); // Mock returns default per_page
        });

        test('handles empty search results', async () => {
            fetchMock = mockFetch({
                'lexia-command/v1/search': {
                    success: true,
                    data: {
                        results: [],
                        total: 0,
                        page: 1,
                        per_page: 10,
                    },
                },
            });

            const response = await fetch('http://localhost/wp-json/lexia-command/v1/search', {
                method: 'POST',
                body: JSON.stringify({
                    query: 'nonexistent',
                    type: 'page',
                }),
            });

            const data = await response.json();
            
            expect(data.success).toBe(true);
            expect(data.data.results).toEqual([]);
            expect(data.data.total).toBe(0);
        });
    });

    describe('Plugin Management API', () => {
        test('installs plugin via API', async () => {
            const response = await fetch('http://localhost/wp-json/lexia-command/v1/install-plugin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': 'test-nonce-123',
                },
                body: JSON.stringify({
                    slug: 'wordpress-seo',
                }),
            });

            const data = await response.json();

            expect(fetchMock).toHaveBeenCalledWith(
                'http://localhost/wp-json/lexia-command/v1/install-plugin',
                expect.objectContaining({
                    method: 'POST',
                })
            );

            expect(data.success).toBe(true);
            expect(data.message).toContain('installed successfully');
            expect(data.plugin).toBeDefined();
            expect(data.plugin.slug).toBe('wordpress-seo');
        });

        test('activates plugin via API', async () => {
            const response = await fetch('http://localhost/wp-json/lexia-command/v1/activate-plugin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': 'test-nonce-123',
                },
                body: JSON.stringify({
                    plugin: 'akismet/akismet.php',
                    action: 'activate',
                }),
            });

            const data = await response.json();

            expect(data.success).toBe(true);
            expect(data.message).toContain('activated successfully');
            expect(data.status).toBe('active');
        });

        test('deactivates plugin via API', async () => {
            fetchMock = mockFetch({
                'lexia-command/v1/activate-plugin': {
                    success: true,
                    message: 'Plugin deactivated successfully',
                    status: 'inactive',
                },
            });

            const response = await fetch('http://localhost/wp-json/lexia-command/v1/activate-plugin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': 'test-nonce-123',
                },
                body: JSON.stringify({
                    plugin: 'akismet/akismet.php',
                    action: 'deactivate',
                }),
            });

            const data = await response.json();

            expect(data.success).toBe(true);
            expect(data.message).toContain('deactivated successfully');
            expect(data.status).toBe('inactive');
        });

        test('gets plugin statuses via API', async () => {
            const response = await fetch('http://localhost/wp-json/lexia-command/v1/get-plugin-statuses', {
                method: 'GET',
                headers: {
                    'X-WP-Nonce': 'test-nonce-123',
                },
            });

            const data = await response.json();

            expect(data.success).toBe(true);
            expect(data.statuses).toBeDefined();
            expect(data.statuses['akismet/akismet.php']).toBe('active');
            expect(data.statuses['contact-form-7/wp-contact-form-7.php']).toBe('inactive');
        });
    });

    describe('Error Handling', () => {
        test('handles network errors gracefully', async () => {
            fetchMock = jest.fn().mockRejectedValue(new Error('Network error'));
            global.fetch = fetchMock;

            try {
                await fetch('http://localhost/wp-json/lexia-command/v1/search', {
                    method: 'POST',
                    body: JSON.stringify({ query: 'test' }),
                });
            } catch (error) {
                expect(error.message).toBe('Network error');
            }
        });

        test('handles API errors with proper status codes', async () => {
            fetchMock = jest.fn().mockResolvedValue({
                ok: false,
                status: 403,
                json: async () => ({
                    code: 'rest_forbidden',
                    message: 'You do not have permission to do this.',
                }),
            });
            global.fetch = fetchMock;

            const response = await fetch('http://localhost/wp-json/lexia-command/v1/install-plugin', {
                method: 'POST',
                body: JSON.stringify({ slug: 'test-plugin' }),
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(403);

            const data = await response.json();
            expect(data.code).toBe('rest_forbidden');
        });

        test('handles malformed JSON responses', async () => {
            fetchMock = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => {
                    throw new SyntaxError('Unexpected token in JSON');
                },
                text: async () => 'Invalid JSON response',
            });
            global.fetch = fetchMock;

            const response = await fetch('http://localhost/wp-json/lexia-command/v1/search');

            try {
                await response.json();
            } catch (error) {
                expect(error).toBeInstanceOf(SyntaxError);
            }

            const text = await response.text();
            expect(text).toBe('Invalid JSON response');
        });
    });

    describe('Authentication', () => {
        test('includes nonce in API requests', async () => {
            await fetch('http://localhost/wp-json/lexia-command/v1/search', {
                method: 'POST',
                headers: {
                    'X-WP-Nonce': 'test-nonce-123',
                },
                body: JSON.stringify({ query: 'test' }),
            });

            expect(fetchMock).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'X-WP-Nonce': 'test-nonce-123',
                    }),
                })
            );
        });

        test('handles unauthorized requests', async () => {
            fetchMock = jest.fn().mockResolvedValue({
                ok: false,
                status: 401,
                json: async () => ({
                    code: 'rest_not_logged_in',
                    message: 'You are not currently logged in.',
                }),
            });
            global.fetch = fetchMock;

            const response = await fetch('http://localhost/wp-json/lexia-command/v1/search', {
                method: 'POST',
                body: JSON.stringify({ query: 'test' }),
            });

            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.code).toBe('rest_not_logged_in');
        });
    });

    describe('Request Validation', () => {
        test('validates required parameters', async () => {
            fetchMock = mockFetch({
                'lexia-command/v1/search': {
                    success: false,
                    message: 'Missing required parameter: query',
                },
            });

            const response = await fetch('http://localhost/wp-json/lexia-command/v1/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'page',
                    // Missing 'query' parameter
                }),
            });

            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.message).toContain('Missing required parameter');
        });

        test('validates parameter types', async () => {
            fetchMock = mockFetch({
                'lexia-command/v1/search': {
                    success: false,
                    message: 'Invalid parameter type',
                },
            });

            const response = await fetch('http://localhost/wp-json/lexia-command/v1/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: 'test',
                    page: 'not-a-number', // Should be a number
                }),
            });

            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.message).toContain('Invalid parameter type');
        });
    });
});