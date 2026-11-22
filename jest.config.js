export default {
  testEnvironment: 'jsdom',
  // Half the cores: many tests mount the whole app, and too many at once run out of time (20 s)
  maxWorkers: '50%',
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
