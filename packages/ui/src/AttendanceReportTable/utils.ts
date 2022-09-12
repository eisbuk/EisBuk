import { DateTime } from "luxon";

import { HoursType } from "./Table";

export type HoursTuple = [booked: number, attended: number];

type HoursWithDeltaTuple = [
  booked: number,
  attended: number,
  delta: number | null
];

type HourTotalsTuple = [booked: number, attended: number, delta: number];

interface Hours {
  [dateStr: string]: HoursTuple;
}

interface AttendanceWithDeltaData {
  [dateStr: string]: HoursWithDeltaTuple;
}

interface HoursByType {
  [HoursType.Booked]: {
    [dateStr: string]: number;
  };
  [HoursType.Attended]: {
    [dateStr: string]: number;
  };
  [HoursType.Delta]: {
    [dateStr: string]: number | null;
  };
}

export const calculateDeltas = (data: Hours) => {
  return Object.entries(data).reduce<AttendanceWithDeltaData>((acc, cur) => {
    const [date, data] = cur;
    const [booked, attended] = data;

    const isNull = !booked && !attended;
    const delta = isNull ? null : attended - booked;

    acc[date] = [booked, attended, delta];
    return acc;
  }, {});
};

export const calculateTotals = (data: AttendanceWithDeltaData) => {
  return Object.values(data).reduce<HourTotalsTuple>(
    (acc, cur) => {
      let [totalBooked, totalAttended, totalDelta] = acc;
      const [booked, attended, delta] = cur;

      return [
        (totalBooked += booked || 0),
        (totalAttended += attended || 0),
        (totalDelta += delta || 0),
      ];
    },
    [0, 0, 0]
  );
};

export const collectDatesByHoursType = (data: AttendanceWithDeltaData) => {
  return Object.entries(data).reduce<HoursByType>(
    (acc, [date, data]) => {
      const [booked, attended, delta] = data;

      acc[HoursType.Booked][date] = booked;
      acc[HoursType.Attended][date] = attended;
      acc[HoursType.Delta][date] = delta;
      return acc;
    },
    { [HoursType.Booked]: {}, [HoursType.Attended]: {}, [HoursType.Delta]: {} }
  );
};

export const isWeekend = (dateStr: string) => {
  const dayOfWeek = DateTime.fromISO(dateStr).weekday;
  return dayOfWeek === 6 || dayOfWeek === 7;
};
