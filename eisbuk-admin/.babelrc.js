const plugins = [["@babel/plugin-proposal-private-methods", { loose: true }]];

const presets = ["@babel/env", "@babel/react", "@babel/typescript"];

module.exports = { plugins, presets };
