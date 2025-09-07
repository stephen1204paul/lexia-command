// Set up the WordPress packages mock
global.wp = {
  element: {
    createElement: jest.fn(),
    Fragment: jest.fn(),
    render: jest.fn(),
  },
  components: {},
  i18n: {
    __: jest.fn((text) => text),
    _x: jest.fn((text) => text),
    _n: jest.fn((single, plural, number) => (number === 1 ? single : plural)),
  },
  apiFetch: jest.fn(),
};

// Mock the global window object with WordPress data
global.window.lexiaCommandData = {
  nonce: 'test-nonce',
  restNamespace: 'lexia-command/v1',
  adminUrl: 'http://example.com/wp-admin/',
  homeUrl: 'http://example.com',
  ajaxUrl: 'http://example.com/wp-admin/admin-ajax.php',
  isAdmin: true,
  userCaps: {
    edit_posts: true,
    manage_options: true,
    upload_files: true,
  },
};

// Mock the document object
global.document.getElementById = jest.fn(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  parentNode: {
    removeChild: jest.fn(),
  },
}));

// Mock document.head for style injection
if (!global.document.head) {
  global.document.head = {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
  };
}

// Mock document.body
if (!global.document.body) {
  global.document.body = {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
  };
}

// Mock CustomEvent for JSDOM
// First, check if CustomEvent is already available
if (typeof global.CustomEvent === 'undefined') {
  global.CustomEvent = class CustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.bubbles = Boolean(options.bubbles);
      this.cancelable = Boolean(options.cancelable);
      this.detail = options.detail || null;
    }
  };
}

// Also ensure window.CustomEvent exists
if (typeof window.CustomEvent === 'undefined') {
  window.CustomEvent = global.CustomEvent;
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Add any other global mocks needed for tests

// Add jest-dom matchers
import '@testing-library/jest-dom';