import { DateTime } from "luxon";

import { map, _reduce, SlotType } from "@eisbuk/shared";

import {
  AthleteAttendanceMonth,
  AttendanceByDate,
  AttendanceBySlotType,
  AttendanceDurations,
  RowItem,
} from "./types";

export const calculateDelta =
  <T>(selector: (data: T) => AttendanceDurations) =>
  (params: T) => {
    const { booked, attended } = selector(params);
    // If there's no data for booking nor attendance, there's no delta (this will result in "-" in the table column)
    if (!booked && !attended) return null;
    // If one of the values is missing (no booking or attendance), we're comparing the other value with 0
    return (attended || 0) - (booked || 0);
  };

export const isWeekend = (dateStr: string) => {
  const dayOfWeek = DateTime.fromISO(dateStr).weekday;
  return dayOfWeek === 6 || dayOfWeek === 7;
};

type AttendanceDurationsToData = (
  hours: AttendanceBySlotType
) => TransformedData | null;
type TransformedData = {
  booked: number;
  delta: number;
};

export const transformAttendanceData =
  <T>(selector: (data: T) => AttendanceDurations) =>
  (params: T) => {
    const { booked, attended } = selector(params);
    // If there's no data for booking nor attendance, there's no delta (this will result in "-" in the table column)
    if (!booked && !attended) return null;
    // If one of the values is missing (no booking or attendance), we're comparing the other value with 0
    const delta = (attended || 0) - (booked || 0);
    return { booked, delta };
  };
/**
 * Creates a interable with the row data ({ date => value} pairs).
 * Used to generate the table data for a particular metric: booked, attended, delta...
 */
const createRowData = (
  dates: Iterable<string>,
  hours: AttendanceByDate,
  transform: AttendanceDurationsToData
) => {
  const hoursLookup = new Map(
    map(hours, ([date, hours]) => [date, transform(hours)])
  );

  return map(dates, (date) => [date, hoursLookup.get(date) ?? null] as const);
};

/**
 * Takes in a list of dates and
 * returns a function to generate a row for a particular athlete for a particluar metric (booked, attended, delta).
 */
export const createRowGenerator =
  (dates: Iterable<string>) =>
  (
    slotType: SlotType,
    attendance: AthleteAttendanceMonth,
    transform: AttendanceDurationsToData
  ): RowItem | undefined => {
    const [athlete, hours] = attendance;

    const dataIter = createRowData(dates, hours, transform);

    const dataObject = Object.fromEntries(dataIter);

    const total = _reduce(
      dataIter,
      (acc, [, value]) => {
        return {
          booked: acc.booked + (value && value.booked ? value.booked : 0),
          delta:
            acc.delta + (value && value.delta !== undefined ? value.delta : 0),
        };
      },
      { booked: 0, delta: 0 }
    );

    if (total.booked === 0 && slotType === "off-ice") return undefined;

    return {
      slotType,
      athlete,
      ...dataObject,
      total: { booked: total.booked, delta: total.delta },
    };
  };
