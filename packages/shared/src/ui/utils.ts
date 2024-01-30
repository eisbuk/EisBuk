/**
 * Processes an interval string to ensure the returned string is in format displayed by the UI
 * (and can be used for matching in the UI).
 *
 * @example
 * ```ts
 * // Using misformatted string
 * getDisplayInterval("10:00-  11:00") // "10:00 - 11:00"
 * getDisplayInterval("10:00-11:00") // "10:00 - 11:00"
 * getDisplayInterval("10:00 - 11:00") // "10:00 - 11:00" (ID)
 *
 * // Using interval object
 * getDisplayInterval({ startTime: "10:00", endTime: "11:00" }) // "10:00 - 11:00"
 * ```
 */
export function getIntervalString(
  interval: string | { startTime: string; endTime: string }
) {
  return typeof interval === "string"
    ? interval.replace(/ /g, "").replace("-", " - ")
    : `${interval.startTime} - ${interval.endTime}`;
}
