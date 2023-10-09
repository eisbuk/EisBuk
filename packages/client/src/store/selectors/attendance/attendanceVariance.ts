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
} from "@eisbuk/shared";
import {
  AthleteAttendanceMonth,
  AttendanceDurations,
  DateAttendancePair,
} from "@eisbuk/ui";

import { LocalStore } from "@/types/store";

import { getMonthStr, calculateIntervalDuration } from "@/utils/helpers";

type CustomerNameTuple = [name: string, surname: string];

type Attendance = NonNullable<LocalStore["firestore"]["data"]["attendance"]>;
type Customers = NonNullable<LocalStore["firestore"]["data"]["customers"]>;

export const processAttendances = (
  attendance: Attendance,
  customers: Customers,
  month: string
) => {
  const final = wrapIter(Object.values(attendance))
    // Get only current month's attendance
    .filter(filterAttendanceByMonth(month))
    // Flatten the slot attendances so that we end up with iterable of { customerId => attendanceIntervalsWithSlotMeta } pairs
    .flatMap(({ date, attendances }) =>
      // { customerId => attendanceIntervals } pairs
      Object.entries(attendances).map(valueMapper(mergeMapper({ date })))
    )
    // { customerId => attendanceDurations } pairs
    .map(valueMapper(convertIntervalsToDurations))
    // { customerId => { date => attendanceDurations } } pairs
    .map(valueMapper(datePairFromAttendance))
    // Group by customer id -> { customerId => Iterable<attendanceDurations> } pairs
    ._group(ID)
    // Aggragate each customer's attendances by date
    .map(valueMapper(aggregateAttendanceByDate))
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
  const { attendance = {}, customers = {} } = firestore.data;

  const currentMonth = getMonthStr(calendarDay, 0);

  return processAttendances(attendance, customers, currentMonth);
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
  acc: AttendanceDurations,
  curr: AttendanceDurations
) => ({
  booked: acc.booked + curr.booked,
  attended: acc.attended + curr.attended,
});

const aggregateAttendanceEntries = (
  attendances: Iterable<AttendanceDurations>
) => _reduce(attendances, aggregateAttendance, { booked: 0, attended: 0 });

const aggregateAttendanceByDate = (
  attendances: Iterable<DateAttendancePair<AttendanceDurations>>
): Iterable<DateAttendancePair<AttendanceDurations>> =>
  wrapIter(attendances)
    // Group each pair by date:
    // { date => attendanceDurations } -> { date => Iterable<attendanceDurations> } pairs
    ._group(ID)
    // Aggregate attendance data for each date:
    // { date => Iterable<attendanceDurations> } -> { date => attendanceDurations } pairs (in this case, attendanceDurations are aggregated)
    .map(valueMapper(aggregateAttendanceEntries));
