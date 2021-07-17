const path = require("path");

module.exports = {
  stories: ["../src/stories/@(solved|staging)/*.stories.@(js|jsx|ts|tsx|mdx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/preset-create-react-app",
  ],
  webpackFinal: (config) => {
    const src = path.resolve(process.cwd(), "src");

    console.log("SRC > ", src);

    config.resolve.alias = {
      ...config.resolve.alias,
      "@": src,
    };

    return config;
  },
};
