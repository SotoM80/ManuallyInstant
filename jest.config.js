export default {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/test'],
  setupFilesAfterEnv: ['<rootDir>/test/setupTests.ts'],
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }] },
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/test/styleMock.js',
    '\\.(svg|png|jpe?g|gif|webp)$': '<rootDir>/test/fileMock.js',
  },
};
