const plugins = [
  [
    "@babel/transform-runtime",
    {
      helpers: false,
      regenerator: true,
    },
  ],
];

const presets = ["@babel/env", "@babel/react", "@babel/typescript"];

module.exports = { plugins, presets };
