module.exports = {
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/preset-create-react-app",
    "storybook-addon-material-ui",
  ],
  babel: async (options) => ({
    ...options,
    plugins: [
      ...options.plugins,
      [
        "babel-plugin-import",
        {
          libraryName: "@material-ui/core",
          // Use "'libraryDirectory': ''," if your bundler does not support ES modules
          libraryDirectory: "esm",
          camel2DashComponentName: false,
        },
        "core",
      ],
      [
        "babel-plugin-import",
        {
          libraryName: "@material-ui/icons",
          // Use "'libraryDirectory': ''," if your bundler does not support ES modules
          libraryDirectory: "esm",
          camel2DashComponentName: false,
        },
        "icons",
      ],
      [
        "@babel/transform-runtime",
        {
          helpers: false,
          regenerator: true,
        },
      ],
    ],
    presets: [
      ...options.presets,
      "@babel/env",
      "@babel/react",
      "@babel/typescript",
    ],
  }),
};
