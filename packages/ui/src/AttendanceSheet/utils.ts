import { calculateIntervalDurationInMinutes } from "@eisbuk/shared";

enum BookingDuration {
  "0.5h" = "½h",
  "1h" = "1h",
  "1.5h" = "1½h",
  "2h" = "2h",
  "2+h" = "2H+",
}

export const getIntervalLabel = (interval: string): BookingDuration => {
  const durationInMinutes = calculateIntervalDurationInMinutes(interval);

  // exit early with catch all if duration greater than expected
  if (durationInMinutes > 120) return BookingDuration["2+h"];

  if (durationInMinutes < 40) {
    return BookingDuration["0.5h"];
  }
  if (durationInMinutes < 70) {
    return BookingDuration["1h"];
  }
  if (durationInMinutes < 90) {
    return BookingDuration["1.5h"];
  }
  return BookingDuration["2h"];
};
