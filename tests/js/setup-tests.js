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
}));

// Add any other global mocks needed for tests