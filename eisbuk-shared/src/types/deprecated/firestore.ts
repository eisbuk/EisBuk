import { Timestamp } from "@google-cloud/firestore";

import { DeprecatedDuration } from "../../enums/deprecated/firestore";
import { Category, SlotType } from "../../enums/firestore";

/**
 * Base slot structure
 */
interface DeprecatedSlotBase {
  /**
   * Date in firebase Timestamp format
   */
  date: Timestamp;
  /**
   * Durations (currently temp) for which the user can register
   */
  durations: DeprecatedDuration[];
  /**
   * Categories of athletes (according to level of proficiency) this slot is aimed at
   */
  categories: Category[];
  /**
   * Type of slot (ice, off-ice-dancing, off-ice-gym)
   */
  type: SlotType;
  /**
   * Optional notes displayed on slot (training location etc.)
   */
  notes: string;
  absentees?: Record<string, boolean>;
}

/**
 * Generic for slot interface,
 * if passed optional "id", extends base slot interface,
 * as id is not always present
 */
export type DeprecatedSlot<ID extends "id" | false = false> = ID extends "id"
  ? DeprecatedSlotBase & {
      /**
       * Id of the slot (not present in a few cases)
       */
      id: string;
    }
  : DeprecatedSlotBase;

export type DeprecatedExtendedSlot<E extends Record<string, any>> =
  DeprecatedSlot<"id"> & E;

/**
 * Entry for booked slot, extended with duration (booked duration)
 */
export type DeprecatedBookingInfo = DeprecatedExtendedSlot<{
  duration: DeprecatedDuration;
}>;
