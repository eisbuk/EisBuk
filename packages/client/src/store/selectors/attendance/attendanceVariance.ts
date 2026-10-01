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
  calculateIntervalDuration,
} from "@eisbuk/shared";
import {
  AthleteAttendanceMonth,
  AttendanceByDate,
  AttendanceBySlotType,
  AttendanceDurations,
  DateAttendancePair,
} from "@eisbuk/ui";

import { LocalStore } from "@/types/store";

import { getMonthStr } from "@/utils/helpers";

type CustomerNameTuple = [name: string, surname: string];

type AttendanceDurationsWithType = AttendanceDurations & { slotType: SlotType };

type Attendance = NonNullable<LocalStore["firestore"]["data"]["attendance"]>;
type Customers = NonNullable<LocalStore["firestore"]["data"]["customers"]>;
type Slots = Record<string, SlotInterface>;

/**
 * An attendance entry that can't be placed in the month summary because its slot
 * (needed for the slot type) or its customer (needed for the name) isn't in the store:
 * either it hasn't been loaded yet, or the data is inconsistent.
 */
export interface UnresolvedAttendanceEntry {
  slotId: string;
  customerId: string;
  date: string;
}

export const processAttendances = (
  attendance: Attendance,
  slots: Slots,
  customers: Customers,
  month: string,
) =>
  wrapIter(Object.entries(attendance))
    // Get only current month's attendance
    .filter(([, attendance]) => filterAttendanceByMonth(month)(attendance))
    // Flatten the slot attendances so that we end up with iterable of { customerId => attendanceIntervalsWithSlotMeta } pairs
    .flatMap(([slotId, { date, attendances }]) =>
      // Entries we can't place (slot or customer not in store) are left out here
      // and reported by 'findUnresolvedAttendances' instead
      !slots[slotId]
        ? []
        : // { customerId => attendanceIntervals } pairs
          Object.entries(attendances)
            .filter(([customerId]) => customers[customerId])
            .map(
              valueMapper(mergeMapper({ date, slotType: slots[slotId].type })),
            ),
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

/**
 * Returns the attendance entries (for the given month) that 'processAttendances' leaves out
 * because their slot or customer isn't in the store, so that they can be shown as missing
 * instead of silently vanishing from the summary.
 */
export const findUnresolvedAttendances = (
  attendance: Attendance,
  slots: Slots,
  customers: Customers,
  month: string,
): UnresolvedAttendanceEntry[] =>
  Object.entries(attendance)
    .filter(([, attendance]) => filterAttendanceByMonth(month)(attendance))
    .flatMap(([slotId, { date, attendances }]) =>
      Object.keys(attendances)
        .filter((customerId) => !slots[slotId] || !customers[customerId])
        .map((customerId) => ({ slotId, customerId, date })),
    );

const getMonthData = (state: LocalStore) => {
  const { app, firestore } = state;
  const { calendarDay } = app;
  const { attendance = {}, customers = {}, slotsByDay = {} } = firestore.data;

  const currentMonth = getMonthStr(calendarDay, 0);
  const slots = Object.fromEntries(
    flatMap(
      // The `= {}` destructuring default above only covers `undefined`, not `null`
      // (which the store type allows); the month entry itself can also be missing
      // (month not loaded yet, or no slots that month), in which case
      // `Object.values(undefined)` would throw.
      Object.values(slotsByDay?.[currentMonth] || {}),
      (slots) => Object.entries(slots),
    ),
  );

  return [attendance, slots, customers, currentMonth] as const;
};

export const getMonthAttendanceVariance = (
  state: LocalStore,
): AthleteAttendanceMonth[] => processAttendances(...getMonthData(state));

export const getMonthAttendanceUnresolved = (
  state: LocalStore,
): UnresolvedAttendanceEntry[] =>
  findUnresolvedAttendances(...getMonthData(state));

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
  (id: string): CustomerNameTuple => [
    customerLookup[id].surname,
    customerLookup[id].name,
  ];

const compareCustomerNames = (
  [[a]]: [CustomerNameTuple, any],
  [[b]]: [CustomerNameTuple, any],
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
  { slotType, booked, attended }: AttendanceDurationsWithType,
) => ({
  ...acc,
  [slotType]: {
    booked: acc[slotType].booked + booked,
    attended: acc[slotType].attended + attended,
  },
});

const aggregateAttendanceEntries = (
  attendances: Iterable<AttendanceDurationsWithType>,
): AttendanceBySlotType =>
  _reduce(attendances, aggregateAttendance, {
    [SlotType.Ice]: { booked: 0, attended: 0 },
    [SlotType.OffIce]: { booked: 0, attended: 0 },
  });

const aggregateAttendanceByDate = (
  attendances: Iterable<DateAttendancePair<AttendanceDurationsWithType>>,
): AttendanceByDate =>
  wrapIter(attendances)
    // Group each pair by date:
    // { date => attendanceDurations } -> { date => Iterable<attendanceDurations> } pairs
    ._group(ID)
    // Aggregate attendance data for each date:
    // { date => Iterable<attendanceDurations> } -> { date => attendanceDurations } pairs (in this case, attendanceDurations are aggregated)
    .map(valueMapper(aggregateAttendanceEntries));
