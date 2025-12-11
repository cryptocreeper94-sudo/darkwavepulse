const { createDefaultEsmPreset } = require('ts-jest');

const defaultEsmPreset = createDefaultEsmPreset();

module.exports = {
  testEnvironment: 'node',
  ...defaultEsmPreset,
  roots: ['<rootDir>/src/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testTimeout: 30000,
};
