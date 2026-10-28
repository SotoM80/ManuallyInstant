export default {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/test'],
  setupFilesAfterEnv: ['<rootDir>/test/setupTests.ts'],
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }] },
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/test/styleMock.js',
    '\\.(svg|png|jpe?g|gif|webp)$': '<rootDir>/test/fileMock.js',
    // Jest cannot read import.meta.env, so the server's address comes from a stand-in
    '/export/cmykServerUrl$': '<rootDir>/test/cmykServerUrlMock.ts',
  },
};
