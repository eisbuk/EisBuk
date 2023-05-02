import { DateTime } from "luxon";

enum BookingDuration {
  "0.5h" = "½h",
  "1h" = "1h",
  "1.5h" = "1½h",
  "2h" = "2h",
  "2+h" = "2H+",
}

export const calculateIntervalDuration = (
  startTime: string,
  endTime: string
): BookingDuration => {
  const luxonStart = DateTime.fromISO(startTime);
  const luxonEnd = DateTime.fromISO(endTime);
  const { minutes } = luxonEnd.diff(luxonStart, ["minutes"]);

  // exit early with catch all if duration greater than expected
  if (minutes > 120) return BookingDuration["2+h"];

  if (minutes < 40) {
    return BookingDuration["0.5h"];
  }
  if (minutes < 70) {
    return BookingDuration["1h"];
  }
  if (minutes < 90) {
    return BookingDuration["1.5h"];
  }
  return BookingDuration["2h"];
};
