const SECRET_KEY = /[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}/gi;

/**
 * Returns a copy of `value` with every uuid (athletes' secret keys, found e.g. in
 * the page URL Sentry attaches to each event) in its strings replaced by "<secret-key>".
 */
export const scrubSecretKeys = <T>(value: T, depth = 0): T => {
  if (typeof value === "string") {
    return value.replace(SECRET_KEY, "<secret-key>") as unknown as T;
  }
  if (!value || typeof value !== "object" || depth > 20) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) =>
      scrubSecretKeys(item, depth + 1)
    ) as unknown as T;
  }
  // Leave class instances (if any) as they are, only copy plain objects
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      scrubSecretKeys(item, depth + 1),
    ])
  ) as T;
};
