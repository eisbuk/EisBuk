/* eslint-disable camelcase */
import { DocumentData, Timestamp } from "@google-cloud/firestore";

import {
  Duration,
  Category,
  SlotType,
  Notes,
  OrgSubCollection,
  BookingSubCollection,
  Collection,
} from "@/enums/firestore";

// ***** Region Orgainzation ***** //
/**
 * Metadata record included in each organization (other than nested collections)
 */
interface OrganizationMeta {
  admins: string[];
}
// ***** End Region Organization ***** //

// ***** Region Slots ***** //
/**
 * Base slot structure
 */
interface SlotBase extends DocumentData {
  date: Timestamp;
  durations: Duration[];
  categories: Category[];
  type: SlotType;
  notes: Notes;
}

/**
 * Generic for slot interface,
 * if passed optional "id", extends base slot interface,
 * as id is not always present
 */
export type Slot<ID extends "id" | false = false> = ID extends "id"
  ? SlotBase & {
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
 * Agregated slots in Firestore DB, named slots by day,
 * but in fact, agragated by month for easier access (containing full data about the slot)
 */
export interface SlotsByDay {
  [monthStr: string]: {
    [dayStr: string]: {
      [slotId: string]: DailySlotEntry;
    };
  };
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
interface BookingsByDay {
  [monthStr: string]: {
    [slotId: string]: {
      [customer_id: string]: Duration;
    };
  };
}
// ***** End Region Bookings ***** //

/**
 * Full firestore database schema as inferred from test data
 */
export interface EFirestoreSchema {
  [Collection.Organizations]: {
    [organization: string]: OrganizationMeta & {
      [OrgSubCollection.Slots]: { [slotId: string]: Slot };
      [OrgSubCollection.SlotsByDay]: SlotsByDay;
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

// ***** Region  ***** //
type FirestoreStatusKey =
  | Exclude<OrgSubCollection, "slots">
  | BookingSubCollection
  | string;
// this (last) part should be written as `organization/${string}` to be more specific
// but as it's a relatively new feature, it doesn't provide much difference in type safety
// it's omitted because prettier finds it as syntax error and refuses to format

/**
 * Values of firestore.status in local store
 * used as firestore.requestinf and firestore.requested firestore.timestamp
 */
export type FirestoreStatusEntry<V extends boolean | number> = Record<
  FirestoreStatusKey,
  V
>;

/**
 * firestore.data structure in local store
 */
export interface FirestoreData {
  [Collection.Organizations]: Record<string, OrganizationMeta>;
  [OrgSubCollection.Customers]: Record<string, Customer>;
  [OrgSubCollection.BookingsByDay]: BookingsByDay;
  [OrgSubCollection.Bookings]: BookingsMeta;
  [BookingSubCollection.SubscribedSlots]: Record<string, BookingInfo>;
  [OrgSubCollection.SlotsByDay]: SlotsByDay;
}

export interface FirestoreOrdered {
  [Collection.Organizations]: Array<{ id: string; admins: string[] }>;
  [OrgSubCollection.Customers]: Customer[];
  [OrgSubCollection.BookingsByDay]: Array<
    BookingsByDay[keyof BookingsByDay] & { id: string }
  >;
  [OrgSubCollection.Bookings]: [BookingsMeta & { id: string }];
  [BookingSubCollection.SubscribedSlots]: BookingInfo[];
  [OrgSubCollection.SlotsByDay]: Array<
    SlotsByDay[keyof SlotsByDay] & { id: string }
  >;
}
