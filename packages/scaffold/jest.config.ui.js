const baseConfig = require("./jest.config.js");

module.exports = {
  ...baseConfig,
  coveragePathIgnorePatterns: [
    ...baseConfig.coveragePathIgnorePatterns,

    // For UI, the usage of storybook is implied, but should be ignored for test coverage
    ".*\\.stories\\.tsx",
  ],
  testEnvironment: "jsdom",
};
