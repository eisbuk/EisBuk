/* eslint-disable @typescript-eslint/no-var-requires */
// const fs = require("fs");
const path = require("path");
const nodeExternals = require("webpack-node-externals");

// const entry = fs.readdirSync("src").reduce(
//   (acc, curr) => {
//     const currKey = curr.replace(".ts", "");

//     return {
//       ...acc,
//       [currKey]: {
//         import: `./src/${curr}`,
//         dependOn: "shared",
//       },
//     };
//   },
//   { shared: "eisbuk-shared" }
// );

module.exports = {
  entry: "./src/index.ts",
  resolve: {
    extensions: [".js", ".ts"],
  },
  output: {
    path: path.resolve(process.cwd(), "./dist"),
    filename: "index.js",
    libraryTarget: "commonjs",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        options: {
          transpileOnly: true,
        },
      },
    ],
  },
  externalsPresets: { node: true },
  externals: [
    // ignore node_modules as they're installed (with respect to package.json)
    // on our cloud functions container image
    nodeExternals({
      // we're adding exception to ignored modules to include symlinked 'eisbuk-shared' in the bundle
      allowlist: ["eisbuk-shared"],
    }),
  ],
  // create source map for bundle to allow for inspection of bundled deps
  devtool: "source-map",
};
