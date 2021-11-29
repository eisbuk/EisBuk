import { BuildOptions } from "esbuild";
import path from "path";
import svgr from "esbuild-plugin-svgr";

/**
 * A base esbuild config file shared between both `build` and `serve`
 * scripts.
 */
const config: BuildOptions = {
  entryPoints: [path.join(process.cwd(), "src", "index.tsx")],
  plugins: [svgr()],
  bundle: true,
  target: "es6",
  format: "cjs",
  minify: true,
};

export default config;
