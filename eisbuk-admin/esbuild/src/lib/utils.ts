import { parse as parseEnv } from "dotenv";
import path from "path";
import fs from "fs";

/**
 * Searches for `.env` file and `.env.${NODE_ENV}.local` files.
 * If env file(s) found, returns a stringified object populated with env variables (including `NODE_ENV`),
 * to be used as `process.env`, if files are empty/not-found, the return object contains only `NODE_ENV`.
 *
 * @param {string} rootPath path to the root of the project, where to look for the .env files
 * @param {string} nodeEnv `"development"`, `"test"` or `"production"`, if not specified (or invalid), falls back to "development"
 * @returns JSON stringified object to be used as process, containing `{ env: { ...envVariables } }`
 */
export const loadEnv = async (
  rootPath: string,
  nodeEnv: string
): Promise<string> => {
  const nodeEnvWhitelist = ["development", "test", "production"];

  const nodeEnvInvalid =
    typeof nodeEnv !== "string" || !nodeEnvWhitelist.includes(nodeEnv);

  let NODE_ENV;

  if (!nodeEnv) {
    NODE_ENV = "development";
    console.log('NODE_ENV not specified, using "development" as default');
  } else if (nodeEnvInvalid) {
    NODE_ENV = "development";
    console.log('Invalid value for NODE_ENV, using "development" as default');
  } else {
    NODE_ENV = nodeEnv;
    console.log(`Using provided value for NODE_ENV: "${NODE_ENV}"`);
  }

  let env = { NODE_ENV };

  // the env variables are loaded in this order so that specific `.env.${NODE_ENV}.local`
  // file can take presedence (overwrite vars present in both of the files)
  [".env", `.env.${NODE_ENV}.local`].forEach((fName) => {
    const pathToFile = path.join(rootPath, fName);

    try {
      // load env file
      const envFile = fs.readFileSync(pathToFile);
      // parse env file to extract vars as object
      const envVars = parseEnv(envFile);
      env = { ...env, ...envVars };
    } catch {
      //
    }
  });

  return JSON.stringify({ env });
};
