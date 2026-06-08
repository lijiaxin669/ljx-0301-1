/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverageFrom: [
    'src/utils/**/*.ts',
    'src/config/**/*.ts',
    '!src/**/*.d.ts'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^phaser$': '<rootDir>/tests/__mocks__/phaser.ts'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
