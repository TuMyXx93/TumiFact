module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  globalSetup: './tests/db-test-setup.js',
  setupFiles: ['<rootDir>/tests/env-setup.js'],
  verbose: true
};
