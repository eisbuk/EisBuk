/* eslint-disable camelcase */
import { Timestamp } from "@google-cloud/firestore";

import {
  Duration,
  Category,
  SlotType,
  OrgSubCollection,
  Collection,
} from "../enums/firestore";

// ***** Region Orgainzation ***** //
/**
 * Metadata record included in each organization (other than nested collections)
 */
export interface OrganizationMeta {
  admins: string[];
}
// ***** End Region Organization ***** //

// ***** Region Slots ***** //
/**
 * Base slot structure
 */
interface SlotBase {
  /**
   * Date in firebase Timestamp format
   */
  date: Timestamp;
  /**
   * Durations (currently temp) for which the user can register
   */
  durations: Duration[];
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
}

/**
 * Generic for slot interface,
 * if passed optional "id", extends base slot interface,
 * as id is not always present
 */
export type Slot<ID extends "id" | false = false> = ID extends "id"
  ? SlotBase & {
      /**
       * Id of the slot (not present in a few cases)
       */
      id: string;
    }
  : SlotBase;

/**
 * Type gained by extending `Slot<"id">` slot with any additional key-value pairs passed as `Record<string, any>` into the type argument
 */
export type ExtendedSlot<E extends Record<string, any>> = Slot<"id"> & E;

export type DailySlotEntry = ExtendedSlot<{
  absentees?: Record<string, boolean>;
}>;
/**
 * Record of slots keyed by slot id
 */
export interface SlotsById {
  [slotId: string]: DailySlotEntry;
}
/**
 * Record of days (keyed by date iso strin) and with
 * every day being a record of slots, keyed by slot id
 */
export interface SlotsByDay {
  [dayStr: string]: SlotsById;
}
// ***** End Region Slots ***** //

// ***** Region Customers ***** //
/**
 * User entry in the Firestore DB
 */
export interface Customer {
  id: string;
  birthday: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  category: Category;
  certificateExpiration?: string;
  // eslint-disable-next-line camelcase
  secret_key: string;
}
// ***** End Region Customers ***** //

// ***** Region Bookings ***** //
/**
 * A subset of Customer data used for organization of bookings for customer
 * Appears as meta data under organization -> bookings -> customerId
 */
export type BookingsMeta = Pick<Customer, "name"> &
  Pick<Customer, "surname"> &
  Pick<Customer, "category"> & {
    // eslint-disable-next-line camelcase
    customer_id: string;
  };

/**
 * Entry for booked slot, extended with duration (booked duration)
 */
export type BookingInfo = ExtendedSlot<{ duration: Duration }>;

/**
 * Agregated bookings, named bookings by day, but in fact,
 * agregated by the month, then by slotId and finally keyed with customer id
 * and providing duration of the booked slot as value
 */
export interface BookingsByDay {
  [monthStr: string]: {
    [slotId: string]: {
      [customer_id: string]: Duration;
    };
  };
}
// ***** End Region Bookings ***** //

// ***** Region Full Firestore DB Schema ***** //
/**
 * Full firestore database schema as inferred from test data
 */
export interface EFirestoreSchema {
  [Collection.Organizations]: {
    [organization: string]: OrganizationMeta & {
      [OrgSubCollection.Slots]: { [slotId: string]: Slot };
      [OrgSubCollection.SlotsByDay]: {
        [monthStr: string]: SlotsByDay;
      };
      [OrgSubCollection.Customers]: {
        [customerId: string]: Customer;
      };
      [OrgSubCollection.Bookings]: {
        // values are indexed with secret key (as this is used as simple form of authenticatin)
        [secret_key: string]: BookingsMeta & {
          data: {
            [slotId: string]: BookingInfo;
          };
        };
      };
      [OrgSubCollection.BookingsByDay]: BookingsByDay;
    };
  };
}
// ***** End Region Full Firestore DB Schema ***** //
