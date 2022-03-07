import { BuildOptions } from "esbuild";
import path from "path";
import svgr from "esbuild-plugin-svgr";

const config: BuildOptions = {
  // we're using this (default) entry point in most cases
  // if different `entryPoints` is needed we override this when calling `build` function
  entryPoints: [path.join(process.cwd(), "src", "index.tsx")],
  plugins: [svgr()],
  bundle: true,
  write: true,
  target: "es6",
  format: "cjs",
  minify: true,
};

export default config;
