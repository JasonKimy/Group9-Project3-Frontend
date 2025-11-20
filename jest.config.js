/** @type {import('jest').Config} */
module.exports = {
    preset: 'jest-expo',
    transformIgnorePatterns: [
      'node_modules/(?!(jest-)?@?react-native|expo|@react-navigation|expo-router|expo-modules-core)/'
    ],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  };
  