module.exports = {
  // Use the WordPress Jest preset as a base
  preset: '@wordpress/jest-preset-default',
  
  // The root directory that Jest should scan for tests and modules
  rootDir: '.',
  
  // The test environment that will be used for testing
  testEnvironment: 'jsdom',
  
  // The glob patterns Jest uses to detect test files
  testMatch: [
    '<rootDir>/tests/js/**/*.test.js',
  ],
  
  // Transform files with babel-jest
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  
  // Configure babel transformation for ES modules
  transformIgnorePatterns: [
    'node_modules/(?!(@wordpress|@babel/runtime)/)',
  ],
  
  // Indicates whether each individual test should be reported during the run
  verbose: true,
  
  // Setup files to run before each test
  setupFilesAfterEnv: ['<rootDir>/tests/js/setup-tests.js'],
  
  // Mock CSS imports and WordPress packages
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/js/__mocks__/styleMock.js',
    // Mock WordPress i18n
    '@wordpress/i18n': '<rootDir>/tests/js/__mocks__/i18nMock.js',
  },
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/js/**/*.js',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
};