#!/bin/bash

# This script sets up the testing environment for Lexia Command plugin

# Add testing dependencies to package.json
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @wordpress/jest-preset-default \
  @wordpress/scripts \
  @wordpress/e2e-test-utils-playwright \
  jest \
  jest-environment-jsdom \
  cypress

# Add test scripts to package.json
npm pkg set scripts.test="jest"
npm pkg set scripts.test:watch="jest --watch"
npm pkg set scripts.test:coverage="jest --coverage"
npm pkg set scripts.test:e2e="cypress open"

# Create WordPress test database if it doesn't exist
mysql -u root -e "CREATE DATABASE IF NOT EXISTS wp_test_lexia_command;"

# Set up WordPress test environment
bash bin/install-wp-tests.sh wp_test_lexia_command root '' localhost latest

echo "Test environment setup complete!"
echo "Run 'npm test' to run Jest tests"
echo "Run 'vendor/bin/phpunit' to run PHPUnit tests"
echo "Run 'npm run test:e2e' to run Cypress tests"