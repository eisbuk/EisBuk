/* eslint-disable @typescript-eslint/ban-types */
import {
  type SlotAttendnace,
  wrapIter,
  keyMapper,
  valueMapper,
  mergeMapper,
  ID,
  _reduce,
  CustomerAttendance,
  SlotInterface,
  SlotType,
  flatMap,
} from "@eisbuk/shared";
import {
  AthleteAttendanceMonth,
  AttendanceByDate,
  AttendanceBySlotType,
  AttendanceDurations,
  DateAttendancePair,
} from "@eisbuk/ui";

import { LocalStore } from "@/types/store";

import { getMonthStr, calculateIntervalDuration } from "@/utils/helpers";

type CustomerNameTuple = [name: string, surname: string];

type AttendanceDurationsWithType = AttendanceDurations & { slotType: SlotType };

type Attendance = NonNullable<LocalStore["firestore"]["data"]["attendance"]>;
type Customers = NonNullable<LocalStore["firestore"]["data"]["customers"]>;
type Slots = Record<string, SlotInterface>;

export const processAttendances = (
  attendance: Attendance,
  slots: Slots,
  customers: Customers,
  month: string
) => {
  const final = wrapIter(Object.entries(attendance))
    // Get only current month's attendance
    .filter(([, attendance]) => filterAttendanceByMonth(month)(attendance))
    // Flatten the slot attendances so that we end up with iterable of { customerId => attendanceIntervalsWithSlotMeta } pairs
    .flatMap(([slotId, { date, attendances }]) =>
      // { customerId => attendanceIntervals } pairs
      Object.entries(attendances).map(
        valueMapper(mergeMapper({ date, slotType: slots[slotId].type }))
      )
    )
    // { customerId => attendanceDurations } pairs
    .map(valueMapper(convertIntervalsToDurations))
    // { customerId => { date => attendanceDurations } } pairs
    .map(valueMapper(datePairFromAttendance))
    // Group by customer id -> { customerId => Iterable<attendanceDurations> } pairs
    ._group(ID)
    // Aggragate each customer's attendances by date
    .map(valueMapper(aggregateAttendanceByDate))
    .map((a) => a)
    // Replace customer ids with customer name/surname (before sorting) -> { [name, surname] => Iterable<attendance> } pairs
    .map(keyMapper(replaceCustomerIdWithName(customers)))
    ._array()
    .sort(compareCustomerNames)
    // After sorting, we can join customer name tuple into a string -> { name => Iterable<attendance> } pairs
    .map(keyMapper(joinCustomerName));

  return final;
};

export const getMonthAttendanceVariance = (
  state: LocalStore
): AthleteAttendanceMonth[] => {
  const { app, firestore } = state;
  const { calendarDay } = app;
  const { attendance = {}, customers = {}, slotsByDay = {} } = firestore.data;

  const currentMonth = getMonthStr(calendarDay, 0);
  const slots = Object.fromEntries(
    flatMap(
      Object.values(slotsByDay ? slotsByDay[currentMonth] : {}),
      (slots) => Object.entries(slots)
    )
  );

  return processAttendances(attendance, slots, customers, currentMonth);
};

/**
 * Filters an array of SlotAttendance documents
 * by strict equality to date substring `YYYY-MM`
 * @param {string} month as "YYYY-MM"
 */
export const filterAttendanceByMonth =
  (month: string) => (slotAttendance: SlotAttendnace) =>
    slotAttendance.date.substring(0, 7) === month;

export const replaceCustomerIdWithName =
  (customerLookup: Customers) =>
  (id: string): CustomerNameTuple =>
    [customerLookup[id].name, customerLookup[id].surname];

const compareCustomerNames = (
  [[, a]]: [CustomerNameTuple, any],
  [[, b]]: [CustomerNameTuple, any]
) => (a > b ? 1 : -1);

const joinCustomerName = (customer: CustomerNameTuple) => customer.join(" ");

/**
 * Converts customer attendance (record with `bookedInterval` and `attendedInterval` as string intervals, e.g. `"10:00-11:00"`)
 * to attendance durations (record with `booked` and `attended` as hour durations)
 */
const convertIntervalsToDurations = <A extends CustomerAttendance>({
  attendedInterval,
  bookedInterval,
  ...rest
}: A): Omit<A, "bookedInterval" | "attendedInterval"> &
  AttendanceDurations => ({
  ...rest,
  booked: calculateIntervalDuration(bookedInterval),
  attended: calculateIntervalDuration(attendedInterval),
});

const datePairFromAttendance = <A extends { date: string }>({
  date,
  ...rest
}: A): DateAttendancePair<Omit<A, "date">> => [date, rest];

const aggregateAttendance = (
  acc: AttendanceBySlotType,
  { slotType, booked, attended }: AttendanceDurationsWithType
) => ({
  ...acc,
  [slotType]: {
    booked: acc[slotType].booked + booked,
    attended: acc[slotType].attended + attended,
  },
});

const aggregateAttendanceEntries = (
  attendances: Iterable<AttendanceDurationsWithType>
): AttendanceBySlotType =>
  _reduce(attendances, aggregateAttendance, {
    [SlotType.Ice]: { booked: 0, attended: 0 },
    [SlotType.OffIce]: { booked: 0, attended: 0 },
  });

const aggregateAttendanceByDate = (
  attendances: Iterable<DateAttendancePair<AttendanceDurationsWithType>>
): AttendanceByDate =>
  wrapIter(attendances)
    // Group each pair by date:
    // { date => attendanceDurations } -> { date => Iterable<attendanceDurations> } pairs
    ._group(ID)
    // Aggregate attendance data for each date:
    // { date => Iterable<attendanceDurations> } -> { date => attendanceDurations } pairs (in this case, attendanceDurations are aggregated)
    .map(valueMapper(aggregateAttendanceEntries));
