/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    // This maps your '@/types/Bill' and '@/config/app' to actual paths
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Optional: if you have issues with date-fns or other modules, you might need to transform them
  // transformIgnorePatterns: [
  //   "node_modules/(?!(date-fns)/)"
  // ]
};