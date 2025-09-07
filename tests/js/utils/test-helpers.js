/**
 * Test helpers and utilities for command testing
 */

/**
 * Setup WordPress global data mock
 */
export function setupWordPressGlobals(overrides = {}) {
    const defaults = {
        adminUrl: 'http://localhost/wp-admin/',
        siteUrl: 'http://localhost/',
        restUrl: 'http://localhost/wp-json/',
        nonce: 'test-nonce-123',
        userCaps: {
            manage_options: true,
            edit_posts: true,
            edit_pages: true,
            upload_files: true,
            activate_plugins: true,
            install_plugins: true,
        },
    };

    global.window.lexiaCommandData = {
        ...defaults,
        ...overrides,
    };

    return global.window.lexiaCommandData;
}

/**
 * Mock window.location for navigation tests
 */
export function mockWindowLocation() {
    delete window.location;
    window.location = {
        href: '',
        assign: jest.fn(),
        replace: jest.fn(),
        reload: jest.fn(),
    };
    return window.location;
}

/**
 * Create a mock command for testing
 */
export function createMockCommand(overrides = {}) {
    return {
        id: 'test-command',
        type: 'ACTION',
        category: 'CONTENT',
        title: 'Test Command',
        keywords: ['test', 'mock'],
        icon: '🧪',
        action: jest.fn(),
        ...overrides,
    };
}

/**
 * Create mock search results
 */
export function createMockSearchResults(count = 5, type = 'post') {
    return Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        title: `${type} ${i + 1}`,
        type,
        url: `http://localhost/${type}-${i + 1}`,
        excerpt: `This is ${type} number ${i + 1}`,
    }));
}

/**
 * Create mock plugin data
 */
export function createMockPlugin(overrides = {}) {
    return {
        slug: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        author: 'Test Author',
        description: 'A test plugin for testing',
        rating: 4.5,
        num_ratings: 100,
        active_installs: 1000,
        download_link: 'http://example.com/plugin.zip',
        ...overrides,
    };
}

/**
 * Wait for async operations
 */
export function waitForAsync() {
    return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Mock fetch for API tests
 */
export function mockFetch(responses = {}) {
    const fetch = jest.fn((url, options) => {
        const path = url.replace('http://localhost/wp-json/', '');
        const response = responses[path] || { success: true };
        
        return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => response,
            text: async () => JSON.stringify(response),
        });
    });

    global.fetch = fetch;
    return fetch;
}

/**
 * Mock WordPress apiFetch
 */
export function mockApiFetch() {
    const apiFetch = jest.fn((options) => {
        return Promise.resolve({
            success: true,
            data: {},
        });
    });

    global.wp = {
        ...global.wp,
        apiFetch,
    };

    return apiFetch;
}

/**
 * Clean up after tests
 */
export function cleanup() {
    // Reset window.location
    delete window.location;
    window.location = globalThis.location;

    // Clear WordPress globals
    delete global.window.lexiaCommandData;

    // Clear mocks
    jest.clearAllMocks();
}

/**
 * Assert command structure is valid
 */
export function assertValidCommand(command) {
    expect(command).toHaveProperty('id');
    expect(command).toHaveProperty('type');
    expect(command).toHaveProperty('category');
    expect(command).toHaveProperty('title');
    expect(command).toHaveProperty('keywords');
    expect(Array.isArray(command.keywords)).toBe(true);
    expect(command).toHaveProperty('icon');
    expect(command).toHaveProperty('action');
    expect(typeof command.action).toBe('function');
}

/**
 * Simulate keyboard event
 */
export function simulateKeyPress(key, modifiers = {}) {
    const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
        ...modifiers,
    });
    document.dispatchEvent(event);
    return event;
}