export interface CLIArgs {
  /**
   * `"development"` | `"storybook"` | `"test"` | `"production"`
   */
  NODE_ENV: string;
  /**
   * Prefix for env vars
   */
  envPrefix: string;
  /**
   * Path to output dir
   */
  outdir: string;
  /**
   * A boolean flag used to determine which flow to use.
   * If `true` we're using `serve` if `false` using `build`
   */
  serve: boolean;
}
