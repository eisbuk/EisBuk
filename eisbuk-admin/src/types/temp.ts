import { LocalStore } from "./store";

/**
 * This is a collection of types for updated data model.
 * When the new data model has been integrated, these types should replace the existing
 * (then stale ones).
 *
 * @TODO remove this file when new data model integrated
 */
import { Timestamp } from "@google-cloud/firestore";

import { Category, SlotType } from "eisbuk-shared";

/**
 * Interval for booking. Includes start/end time of the interval.
 */
export interface SlotInterval {
  /**
   * Time of day of interval start.
   * Should be "HH:mm"
   * @TO_ALWAYS_DO add checks for "HH:mm" compatibility when storing to firestore
   */
  startTime: string;
  /**
   * Time of day of interval start.
   * Should be "HH:mm"
   * @TO_ALWAYS_DO add checks for "HH:mm" compatibility when storing to firestore
   */
  endTime: string;
}

/**
 * New interface for slot entry
 */
export interface SlotInterface {
  /**
   * Id of the slot (uuid generated string). Generated by the db initially.
   */
  id: string;
  /**
   * Date of the slot. Should be a day, without time of day.
   * Time of day will be calculated for each interval.
   */
  date: Timestamp;
  /**
   * Type of activity this slot is for: `"ice" | "off_ice_dancing" | "off_ice_gym"`
   */
  type: SlotType;
  /**
   * Athlete categories this slot is suitable for.
   */
  categories: Category[];
  /**
   * Intervals available for booking. Keyed by start-end time.
   *
   * Example:
   * ```
   * ["09:00-10:30"]: {
   *    startTime: "09:00",
   *    endTime: "10:30"
   * }
   * ```
   *
   */
  intervals: {
    [key: string]: SlotInterval;
  };
  /**
   * Notes on the slot
   */
  notes: string;
}

/**
 * Entry for attendance of single user on single slot.
 *
 * `booked` represents interval booked by the customer
 * - if customer booked, this should always be non-null
 * - if not booked by customer (attended without booking) will be `null`
 *
 * `attended` represents interval customer has attended
 * - if customer booked and didn't attend, will be `null`
 * - if not booked and not attended (customer added by mistake), won't be `null` and entry should be deleted.
 */
export interface CustomerAttendance {
  booked: string | null;
  attended: string | null;
}

export interface Attendance {
  [month: string]: {
    [date: string]: {
      [slotId: string]: {
        [customerId: string]: CustomerAttendance;
      };
    };
  };
}

/**
 * A temporary Redux store state. we're using this for tests and as a blueprint for updated store
 */
export type TempStore = Omit<LocalStore, "firestore"> & {
  firestore: ReduxFirestore;
};

type ReduxFirestore = Omit<LocalStore["firestore"], "data"> & {
  data: ReduxFirestoreData;
};

type ReduxFirestoreData = LocalStore["firestore"]["data"] & {
  attendance: Attendance;
};
