const plugins = [
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
  [
    "transform-inline-environment-variables",
    {
      include: ["EISBUK_SITE"],
    },
  ],
];

const presets = ["@babel/env", "@babel/react", "@babel/typescript"];

module.exports = { plugins, presets };
