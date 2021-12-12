import path from "path";

import { CLIArgs } from "../lib/types";

import { createLogger, kebabToCamel } from "./utils";

/**
 * Loads node args passed from CLI
 * @returns options as an { option: value } record
 */
export default (): CLIArgs => {
  const logger = createLogger("ARGV");

  const whitelistedOptions = ["mode", "env-prefix", "distpath"].map(
    (option) => `--${option}`
  );

  const args = process.argv.slice(2);

  // check for serve command
  const subCommand = !args[0].startsWith("--") ? args.splice(0, 1)[0] : "";

  const [serve, subComErr] = ((): [boolean, string | null] => {
    if (!subCommand) return [false, null];
    if (subCommand === "serve") return [true, null];
    const err = `Unknown sub command "${subCommand}", the only sub command currently supported is "serve"`;
    return [false, err];
  })();

  // throw if unknown sub command
  if (subComErr) logger.fatal(subComErr);

  // parse the rest of the args
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
    { mode: "", envPrefix: "", distpath: "" }
  );

  // check nodeEnv and fallback to "development" if needed
  let NODE_ENV = "development";
  const nodeEnvWhitelist = ["development", "test", "storybook", "production"];

  const nodeEnvInvalid =
    typeof parsedArgs.mode !== "string" ||
    !nodeEnvWhitelist.includes(parsedArgs.mode);

  if (!parsedArgs.mode) {
    logger.log(`NODE_ENV not specified, using "${NODE_ENV}" as default`);
  } else if (nodeEnvInvalid) {
    logger.log(`Invalid value for NODE_ENV, using "${NODE_ENV}" as default`);
  } else {
    NODE_ENV = parsedArgs.mode;
    logger.log(`Using provided value for NODE_ENV: "${NODE_ENV}"`);
  }

  // check for env variable prefix and fall back to "REACT_APP" if not defined
  let envPrefix = "REACT_APP";
  if (!parsedArgs.envPrefix) {
    logger.log(`No --env-prefix specified, falling back to ${envPrefix}`);
  } else {
    envPrefix = parsedArgs.envPrefix;
  }

  // check for distpath and apply fallback if necessary
  let distpath = path.join(process.cwd(), serve ? "dev-server-meta" : "dist");
  if (!parsedArgs.distpath) {
    logger.log(`No --distpath provided, using "${distpath}" as fallback`);
  } else {
    distpath = path.join(process.cwd(), parsedArgs.distpath);
    logger.log(`Using, using "${distpath}" as bundle output directory`);
  }

  return { envPrefix, distpath, NODE_ENV, serve };
};
