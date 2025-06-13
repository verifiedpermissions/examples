/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/__tests__/**',
    '!src/types/**',
    '!src/index.ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  verbose: true
};
