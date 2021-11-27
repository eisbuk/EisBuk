interface EConsole {
  log: Console["log"];
  warn: Console["warn"];
  error: Console["error"];
}

/**
 * Creates a custom logger with `prefix` prepended to each message.
 * The created logger supports `.log`, `.warn` and `.error` methods.
 * @param prefix a prefix which to prepend to each logged string
 * @returns
 */
export const createLogger = (prefix: string): EConsole => ({
  log: (message, ...additional) =>
    console.log(`[${prefix}] ${message}`, ...additional),
  warn: (message, ...additional) =>
    console.warn(`[${prefix}] ${message}`, ...additional),
  error: (message, ...additional) =>
    console.error(`[${prefix}] ${message}`, ...additional),
});

/**
 * Picks the entries from passed record with
 * keys starting with provided prefix
 * @param record record to filter
 * @param prefix of the keys picked for return value
 * @returns record containing only entries keyed by strings with provided prefix
 */
export const pickWithPrefix = (
  record: Record<string, any>,
  prefix: string
): Record<string, any> => {
  if (!prefix) throw new Error("[PICK_WITH_PREFIX] Prefix is not defined");

  return Object.keys(record).reduce(
    (acc, key) =>
      key.startsWith(prefix) ? { ...acc, [key]: record[key] } : acc,
    {} as Record<string, any>
  );
};

/**
 * Replaces kebab-case string with camelCase
 *
 * ```
 * kebabToCamel("some-string")
 * // "someString"
 * ```
 * @param str kabak-case string
 * @returns camelCase string
 */
export const kebabToCamel = (str: string): string =>
  str[0] + str.slice(1).replace(/-[a-z]/gi, (s) => s[1].toUpperCase());
