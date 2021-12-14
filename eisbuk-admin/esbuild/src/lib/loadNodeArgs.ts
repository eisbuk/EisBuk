import path from "path";

import { CLIArgs } from "../lib/types";

import { createLogger, kebabToCamel } from "./utils";

import { NodeEnv, Mode } from "./enums";

/**
 * Loads node args passed from CLI
 * @returns options as an { option: value } record
 */
export default (): CLIArgs => {
  const logger = createLogger("ARGV");

  const whitelistedOptions = [
    "NODE_ENV",
    "mode",
    "env-prefix",
    "distpath",
    "hot-reload",
    "public-path",
  ].map((option) => `--${option}`);

  const args = process.argv.slice(2);

  // parse the args
  const parsedArgs = args.reduce(
    (acc, curr, i) => {
      // we're skipping the option values
      // and loading them explicitly for each option
      if (i % 2 === 1) return acc;
      if (!whitelistedOptions.includes(curr)) {
        logger.fatal(`Unknown option ${curr}`);
      }
      // remove prefixed "--" get camelCased option string
      const option = kebabToCamel(curr.slice(2));

      return { ...acc, [option]: args[i + 1] };
    },
    {
      NODE_ENV: "",
      mode: "",
      envPrefix: "",
      distpath: "",
      publicpath: "",
      hotReload: "",
    }
  );

  // check arg for `NODE_ENV` and fallback to "development" if needed
  let NODE_ENV: NodeEnv = NodeEnv.Development;

  const nodeEnvWhitelist = Object.values(NodeEnv);
  const nodeEnvInvalid = !nodeEnvWhitelist.includes(
    parsedArgs.NODE_ENV as NodeEnv
  );

  if (!parsedArgs.NODE_ENV) {
    logger.log(`NODE_ENV not specified, using "${NODE_ENV}" as default`);
  } else if (nodeEnvInvalid) {
    logger.log(`Invalid value for NODE_ENV, using "${NODE_ENV}" as default`);
  } else {
    NODE_ENV = parsedArgs.NODE_ENV as NodeEnv;
    logger.log(`Using provided value for NODE_ENV: "${NODE_ENV}"`);
  }

  // check `mode` arg and fallback to "build" if not provided
  let mode: Mode = Mode.Build;

  const modeArgWhitelist = Object.values(Mode);
  const modeArgInvalid = !modeArgWhitelist.includes(parsedArgs.mode as Mode);

  if (!parsedArgs.mode) {
    logger.log(`Argument for mode not specified, using "${mode}" as default`);
  } else if (modeArgInvalid) {
    logger.log(`Invalid value for 'mode', using "${mode}" as default`);
  } else {
    mode = parsedArgs.mode as Mode;
    logger.log(`Using provided value for 'mode': "${mode}"`);
  }

  // check for env variable prefix and fall back to "REACT_APP" if not defined
  let envPrefix = "REACT_APP";
  if (!parsedArgs.envPrefix) {
    logger.log(`No --env-prefix specified, falling back to ${envPrefix}`);
  } else {
    envPrefix = parsedArgs.envPrefix;
  }

  // check for distpath and apply fallback if necessary
  let distpath = path.join(
    process.cwd(),
    mode === Mode.Build ? "dist" : "dev-server-meta"
  );
  if (!parsedArgs.distpath) {
    logger.log(`No --distpath provided, using "${distpath}" as fallback`);
  } else {
    distpath = path.join(process.cwd(), parsedArgs.distpath);
    logger.log(`Using "${distpath}" as bundle output directory`);
  }

  // check for `publicpath` and apply fallback if necessary
  let publicpath = path.join(process.cwd(), "public");
  if (!parsedArgs.publicpath) {
    logger.log(`No --publicpath provided, using "${publicpath}" as fallback`);
  } else {
    publicpath = path.join(process.cwd(), parsedArgs.publicpath);
    logger.log(`Using, "${publicpath}" as bundle output directory`);
  }

  // check for "hot-reaload" option
  let hotReload = true;
  // a trivial case where hotReload is not possible (build mode)
  if (mode !== Mode.Serve) {
    hotReload = false;
  } else if (!parsedArgs.hotReload) {
    logger.log(`No --hot-reload provided, defaulting to '${hotReload}'`);
  } else if (!["true", "false"].includes(parsedArgs.hotReload)) {
    logger.log(
      `Invalid value for --hot-reload provided, defaulting to '${hotReload}'`
    );
  } else {
    hotReload = parsedArgs.hotReload === "true";
    logger.log(`Hot reload set to '${hotReload}'`);
  }

  return { envPrefix, distpath, NODE_ENV, mode, hotReload, publicpath };
};
