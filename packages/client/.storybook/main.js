const path = require("path");

module.exports = {
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx|mdx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
    "storybook-addon-material-ui5",
    {
      name: "@storybook/addon-postcss",
      options: {
        postcssLoaderOptions: {
          // When using postCSS 8
          implementation: require("postcss"),
        },
      },
    },
  ],
  webpackFinal: (config) => {
    const src = path.resolve(process.cwd(), "src");

    console.log("SRC > ", src);

    config.resolve.alias = {
      ...config.resolve.alias,
      "@": src,
    };

    // we want to use SVGR loader for svgs
    const svgrRule = {
      test: /\.svg$/i,
      enforce: "pre",
      loader: require.resolve("@svgr/webpack"),
    };

    // if fileloader exists, exclude for '.svg'
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule?.test?.test(".svg")
    );
    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/;
    }

    config.module.rules.push(svgrRule);

    return config;
  },
};
