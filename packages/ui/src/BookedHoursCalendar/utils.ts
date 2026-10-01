import i18n, { BookedHours } from "@eisbuk/translations";

/**
 * Formats lesson hours (the club's units, in steps of half an hour) for display,
 * e.g. `1 => "1 ora"`, `1.5 => "1,5 ore"` (Italian), `0 => "0 ore"`.
 */
export const formatHours = (hours: number): string =>
  i18n.t(BookedHours.Hours, {
    count: hours,
    hours: new Intl.NumberFormat(i18n.language || "en", {
      maximumFractionDigits: 1,
    }).format(hours),
  });
