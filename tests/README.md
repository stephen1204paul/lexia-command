# Lexia Command Testing Guide

This document provides instructions for running automated tests for the Lexia Command WordPress plugin.

## Test Types

The testing suite includes:

1. **Unit Tests (PHP)** - Tests individual PHP components in isolation
2. **Integration Tests (PHP)** - Tests PHP components working together, including REST API endpoints
3. **JavaScript Unit Tests** - Tests React components and hooks
4. **End-to-End Tests** - Tests the complete application in a browser environment

## Setup

Before running tests, you need to set up the testing environment:

```bash
# Make the setup script executable
chmod +x tests/setup-tests.sh

# Run the setup script
./tests/setup-tests.sh
```

This will:
- Install necessary npm packages for JavaScript testing
- Set up the WordPress test environment for PHP testing
- Configure the test database

## Running Tests

### PHP Tests

```bash
# Run all PHP tests
npm run test:php

# Run specific test suite
vendor/bin/phpunit --testsuite=unit
vendor/bin/phpunit --testsuite=integration
```

### JavaScript Tests

```bash
# Run all JavaScript tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### End-to-End Tests

```bash
# Start your local WordPress development server first

# Then run Cypress tests
npm run test:e2e
```

## Writing Tests

### PHP Tests

PHP tests should be placed in the `tests/unit` or `tests/integration` directories with filenames prefixed with `test-`.

### JavaScript Tests

JavaScript tests should be placed in the `tests/js` directory, mirroring the structure of the `src/js` directory.

### End-to-End Tests

Cypress tests should be placed in the `tests/cypress/integration` directory.

## Continuous Integration

The tests are configured to run automatically in CI environments. See the GitHub Actions workflow configuration for details.