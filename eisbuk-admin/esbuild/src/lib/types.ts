export interface CLIArgs {
  /**
   * NODE_ENV parsed from `--mode` CLI option:
   * `"development"` | `"storybook"` | `"test"` | `"production"`
   * @default "development"
   */
  NODE_ENV: string;
  /**
   * Bundler mode: "build" | "serve"
   * @default "build"
   */
  mode: "build" | "serve";
  /**
   * Prefix used to filter (pick) env vars.
   * @default "REACT_APP"
   */
  envPrefix: string;
  /**
   * Path (relative to rootdir) to output dir of the entire content (bundle will be added into `/app` dir within that directory)
   * @default "dist"
   */
  distpath: string;
  /**
   * Path (relative to rootdir) to template files (index.html, manifest.json, etc.) to copy
   * to dispath directory
   * @default "public"
   */
  publicpath: string;
  /**
   * A boolean flag to enable/disable reload signals from dev server.
   * Ignored in build mode.
   * @default true
   */
  hotReload: boolean;
}

export interface BuildParams {
  NODE_ENV: CLIArgs["NODE_ENV"];
  envPrefix: CLIArgs["envPrefix"];
  /**
   * Full path to the output bundle dir
   */
  outdir: string;
}

export interface ServeParams extends BuildParams {
  hotReload: CLIArgs["hotReload"];
  /**
   * A directory from which the esbuild server will serve content.
   * Should be equal to `distpath` (since all of the static files will be copied there)
   */
  servedir: string;
}
