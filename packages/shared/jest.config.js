const baseConfig = require("../scaffold/jest.config.js");

module.exports = {
  ...baseConfig,
  preset: "ts-jest",
  testEnvironment: "node",
};
