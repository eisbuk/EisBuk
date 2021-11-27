import { kebabToCamel } from "./utils";

interface BuildOptions {
  /**
   * Build mode, passed as `NODE_ENV`
   */
  mode: string;
  /**
   * Prefix for env vars
   */
  envPrefix: string;
}

/**
 * Loads node args passed from CLI
 * @returns options as an { option: value } record
 */
export default (): BuildOptions => {
  const whitelistedOptions = ["mode", "env-prefix"].map(
    (option) => `--${option}`
  );

  const args = process.argv.slice(2);

  return args.reduce(
    (acc, curr, i) => {
      // we're skipping the option values
      // and loading them explicitly for each option
      if (i % 2 === 1) return acc;
      if (!whitelistedOptions.includes(curr)) {
        throw new Error(`Unknown option ${curr}`);
      }
      // remove prefixed "--" get camelCased option string
      const option = kebabToCamel(curr.slice(2));

      return { ...acc, [option]: args[i + 1] };
    },
    { mode: "", envPrefix: "" }
  );
};
