/* eslint-disable @typescript-eslint/no-var-requires */
const hq = require("alias-hq");

module.exports = {
  moduleNameMapper: {
    ...hq.get("jest"),
    "\\.svg": "<rootDir>/src/__mocks__/svg.ts",
  },
  // transform: {
  //   "\\.tsx?$": ["esbuild-jest"],
  // },
  globalSetup: "<rootDir>/src/__testSetup__/initTests.ts",
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "src/*.{ts,tsx}",
    "functions/**/*.{ts,tsx}",
    "functions/*.{ts,tsx}",
    "!dist/**",
    "!**/node_modules/**",
  ],
  testTimeout: 10000,
};
