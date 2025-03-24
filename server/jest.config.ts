import * as dotenv from 'dotenv';

dotenv.config();

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1' // ✅ Ensures Jest resolves @/ correctly
  },
  moduleDirectories: ['node_modules', 'src'],
  testMatch: [
    '<rootDir>/src/**/*.(test|spec).(ts|js)',
    '<rootDir>/tests/**/*.(test|spec).(ts|js)'
  ],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/build/', '<rootDir>/dist/'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }] // ✅ Ensures Jest uses tsconfig.jest.json
  },
  verbose: true
};