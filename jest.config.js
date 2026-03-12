process.env.NODE_ENV = 'test'; // Define ambiente de teste

module.exports = {
  verbose: true,
  forceExit: true,
  projects: [
    {
      displayName: 'models',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/models/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    },
    {
      displayName: 'migrations',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/migrations/**/*.test.js'],
    },
    {
      displayName: 'routes',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/routes/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    },
    {
      displayName: 'services',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/services/**/*.test.js'],
    },
  ],
  collectCoverageFrom: [
    'models/**/*.js',
    'routes/**/*.js',
    'controllers/**/*.js',
    '!models/index.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};