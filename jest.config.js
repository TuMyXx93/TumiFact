module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  globalSetup: './tests/db-test-setup.js',
  setupFiles: ['<rootDir>/tests/env-setup.js'],
  verbose: true,
  collectCoverageFrom: [
    'routes/**/*.js',
    'middleware/**/*.js',
    'app.js',
    'db.js',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 30,
      lines: 40,
      statements: 40
    }
  }
};
