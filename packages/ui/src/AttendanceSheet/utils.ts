import { calculateIntervalDuration } from "@eisbuk/shared";

enum BookingDuration {
  "0.5h" = "½h",
  "1h" = "1h",
  "1.5h" = "1½h",
  "2h" = "2h",
  "2+h" = "2h+",
}

export const getIntervalLabel = (interval: string): BookingDuration => {
  const duration = calculateIntervalDuration(interval);

  if (duration > 2) return BookingDuration["2+h"];
  return BookingDuration[`${duration}h`];
};
