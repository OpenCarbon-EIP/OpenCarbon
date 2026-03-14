module.exports = {
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/test/jest-setup.js'],
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^@dtos/(.*)$': '<rootDir>/src/dtos/$1',
    '^@prisma/prisma\\.(.*)$': '<rootDir>/src/prisma/prisma.$1',
    '^./internal/class\\.js$':
      '<rootDir>/src/generated/prisma/internal/class.ts',
    '^./enums\\.js$': '<rootDir>/src/generated/prisma/enums.ts',
    '^./internal/prismaNamespace\\.js$':
      '<rootDir>/src/generated/prisma/internal/prismaNamespace.ts',
  },
  extensionsToTreatAsEsm: ['.ts'],
};
