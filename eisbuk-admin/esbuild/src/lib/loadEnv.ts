import { DotenvParseOutput, parse as parseEnv } from "dotenv";
import path from "path";
import fs from "fs";

import { createLogger, pickWithPrefix } from "./utils";

/**
 * Looks for env vars in `.env` and `.env.${NODE_ENV}.local` files and in current `process.env`.
 * Picks only the vars prefixed with provided `envPrefix` and returns a stringified JSON containing
 * the picked vars and `NODE_ENV`.
 *
 * @param {string} rootPath path to the root of the project, where to look for the .env files
 * @param {string} nodeEnv `"development"`, `"test"`, `"storybook"` or `"production"`, if not specified (or invalid), falls back to "development"
 * @param {string} envPrefix `"development"`, `"test"`, `"storybook"` or `"production"`, if not specified (or invalid), falls back to "development"
 * @returns JSON stringified object to be used as process, containing `{ env: { ...envVariables } }`
 */
export const loadEnv = async (
  rootPath: string,
  NODE_ENV: string,
  envPrefix: string
): Promise<string> => {
  // create a custom logger prepending every message with "[LOAD_ENV]"
  const logger = createLogger("LOAD_ENV");

  // load envs from env files (if any)
  logger.log(`Looking for env files in ${rootPath}`);
  const parsedEnvFiles = await Promise.all(
    // the env files are loaded in this order so that more specific `.env.${NODE_ENV}.local`
    // file can take presedence (overwrite vars present in both of the files)
    [".env", `.env.${NODE_ENV}.local`].map((fName) => {
      const pathToFile = path.join(rootPath, fName);
      return loadEnvFile(pathToFile, logger);
    })
  );

  // pick env vars containing the provided prefix
  logger.log(`Looking for vars prefixed with "${envPrefix}"`);
  // env vars from files and process.env are added in this order
  // to keep order of presedence:
  // `process.env` -> `.env.${NODE_ENV}.local` -> `.env`
  const processedVars = [parsedEnvFiles, process.env].reduce(
    (acc, curr) => ({
      ...acc,
      // pick only the vars with provided prefix from each file/process.env
      ...pickWithPrefix(curr, envPrefix),
    }),
    {}
  );

  return JSON.stringify({ env: { ...processedVars, NODE_ENV } });
};

/**
 * Async load env file using `dotenv.parser`.
 * @param pathToFile path to env file
 * @param logger custom logger with prefix (if not provided, falls back to generic `console`)
 * @returns Promise which always resolves (either with record of env vars or empty record)
 */
const loadEnvFile = (
  pathToFile: string,
  logger: ReturnType<typeof createLogger> = console
) =>
  new Promise<DotenvParseOutput>((res) => {
    logger.log(pathToFile, "-- looking for env file...");
    // load env file
    fs.readFile(pathToFile, (err, envFile) => {
      // fail early if file not found
      if (err) {
        logger.log(pathToFile, "-- file not found");
        // return empty object for type consistency
        res({} as DotenvParseOutput);
        return;
      }

      // parse env file to extract vars as object
      logger.log(pathToFile, "-- found, loading env vars...");
      const envVars = parseEnv(envFile);
      logger.log(pathToFile, "-- successfully loaded anv vars");
      res(envVars);
    });
  });

export default loadEnv;
