const path = require("path");
module.exports = {
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: ["@storybook/addon-links", "@storybook/addon-essentials", "@storybook/addon-interactions", "@storybook/addon-mdx-gfm"],
  framework: {
    name: "@storybook/react-vite",
    options: {}
  },
  webpackFinal: config => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@assets": path.join(__dirname, "..", "src", "assets")
    };
    return config;
  },
  docs: {
    autodocs: true
  }
};