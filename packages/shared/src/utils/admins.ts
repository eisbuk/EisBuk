/**
 * Normalizes an admin entry (email or phone number) so that it matches, character for character,
 * the email or phone number the user authenticates with (admin checks, both in firestore rules and
 * in cloud functions, are an exact string match).
 *
 * - surrounding whitespace is removed (e.g. from copy-pasting)
 * - phone numbers are stripped of spaces and separators, a leading "00" is replaced with "+"
 *   and, if no dial code is present, `defaultCountryCode` is prepended
 *   (phone auth always uses the international format, e.g. "+393331234567")
 *
 * @param entry admin entry as typed in by the user
 * @param defaultCountryCode dial code (e.g. "+39") used for phone numbers entered without one
 * @example
 * ```
 * normalizeAdminEntry(" john@example.com ") // "john@example.com"
 * normalizeAdminEntry("333 123 4567", "+39") // "+393331234567"
 * ```
 */
export const normalizeAdminEntry = (
  entry: string,
  defaultCountryCode = "",
): string => {
  const trimmed = entry.trim();

  const isPhone = /^\+?[\d\s\-./()]+$/.test(trimmed);
  if (!isPhone) return trimmed;

  const digits = trimmed.replace(/[^\d]/g, "");

  if (trimmed.startsWith("+")) return `+${digits}`;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;

  return `${defaultCountryCode}${digits}`;
};
