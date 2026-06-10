/**
 * Default list of keys considered personal/sensitive data wherever they appear
 * in a structure: customer identity fields, contact data, secrets and message
 * payloads (which embed customer data in free text).
 */
export const defaultPIIKeys = [
  "name",
  "surname",
  "email",
  "phone",
  "birthday",
  "certificateExpiration",
  "photoURL",
  "secretKey",
  "registrationCode",
  "password",
  "smtpPass",
  "smtpUser",
  "smsAuthToken",
  "authToken",
  "ip_address",
  // Email/SMS payload fields (interpolated with customer data)
  "html",
  "subject",
  "to",
  "bcc",
  "cc",
  "message",
  "attachments",
];

/**
 * Returns a deep copy of `value` with the values of all properties whose key
 * is in `keys` (at any depth) replaced by "[Filtered]". Used to scrub personal
 * data out of structures before handing them to third parties (e.g. Sentry
 * error reports - athletes' data shouldn't end up in the error tracker).
 *
 * Non-plain values (class instances, functions) are passed through untouched,
 * and circular references are left in place rather than followed.
 */
export const scrubPII = <T>(value: T, keys: string[] = defaultPIIKeys): T => {
  const keySet = new Set(keys);
  const seen = new WeakSet<object>();

  const scrub = (node: any): any => {
    if (node === null || typeof node !== "object") {
      return node;
    }
    if (seen.has(node)) {
      return node;
    }
    seen.add(node);

    if (Array.isArray(node)) {
      return node.map(scrub);
    }

    // Leave non-plain objects (Dates, class instances, ...) untouched
    if (Object.getPrototypeOf(node) !== Object.prototype) {
      return node;
    }

    return Object.entries(node).reduce(
      (acc, [key, val]) => {
        acc[key] = keySet.has(key) ? "[Filtered]" : scrub(val);
        return acc;
      },
      {} as Record<string, any>,
    );
  };

  return scrub(value);
};
