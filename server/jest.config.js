"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleFileExtensions: ['js', 'ts'],
    testMatch: ['**/*.test.ts'],
    moduleNameMapper: {
        '@/(.*)': '<rootDir>/src/$1',
    },
    clearMocks: true,
    verbose: true,
};
exports.default = config;
