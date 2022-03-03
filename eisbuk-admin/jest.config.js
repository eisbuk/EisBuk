/* eslint-disable @typescript-eslint/no-var-requires */
const hq = require("alias-hq");

module.exports = {
  moduleNameMapper: {
    ...hq.get("jest"),
    "\\.svg": "<rootDir>/src/__mocks__/svg.ts",
  },
  globalSetup: "<rootDir>/src/__testSetup__/initTests.ts",
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "src/*.{ts,tsx}",
    "functions/**/*.{ts,tsx}",
    "functions/*.{ts,tsx}",
    "!dist/**",
    "!**/node_modules/**",
  ],
  coveragePathIgnorePatterns: ["node_modules", ".*\\.stories\\.tsx"],
  testTimeout: 10000,
};
