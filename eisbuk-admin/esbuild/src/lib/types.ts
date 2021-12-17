import { DeployStage, Mode, NodeEnv } from "./enums";

export interface CLIArgs {
  /**
   * Node's NODE_ENV variable
   * @default
   * - "production" for "build" mode
   * - "development" for "serve" mode
   */
  NODE_ENV: NodeEnv;
  /**
   * Env variable we're using to  provide different stage of deployment (environment)
   * without extending (messing up) default NODE_ENV values.
   *
   * Why not to use NODE_ENV for this:
   * https://rafaelalmeidatk.com/blog/why-you-should-not-use-a-custom-value-with-node-env
   *
   * @default =NODE_ENV
   */
  DEPLOY_STAGE: DeployStage;
  /**
   * Bundler mode: "build" | "serve"
   * @default "build"
   */
  mode: Mode;
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
  /**
   * Full path to the output bundle dir
   */
  outdir: string;
  /**
   * Stringified JSON of process.env variables
   */
  processEnv: string;
}

export interface ServeParams extends BuildParams {
  hotReload: CLIArgs["hotReload"];
  /**
   * A directory from which the esbuild server will serve content.
   * Should be equal to `distpath` (since all of the static files will be copied there)
   */
  servedir: string;
}
