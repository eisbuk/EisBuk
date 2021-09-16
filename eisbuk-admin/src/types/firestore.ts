/* eslint-disable camelcase */
import {
  Collection,
  OrgSubCollection,
  BookingSubCollection,
  OrganizationMeta,
  SlotsByDay,
  Customer,
  CustomerBookingEntry,
  SlotAttendnace,
  CustomerBase,
} from "eisbuk-shared";

// ***** Region In-Store Firebase Date Scheme ***** //
type FirestoreStatusKey =
  | Exclude<OrgSubCollection, "slots">
  | BookingSubCollection
  | string;
// this (last) part should be written as `organization/${string}` to be more specific
// but as it's a relatively new feature and it doesn't provide much difference in type safety
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
  [Collection.Organizations]: { [organization: string]: OrganizationMeta };
  [OrgSubCollection.Customers]: { [customerId: string]: Customer };
  [OrgSubCollection.Bookings]: CustomerBase;
  [BookingSubCollection.BookedSlots]: {
    [slotId: string]: CustomerBookingEntry;
  };
  [OrgSubCollection.SlotsByDay]: { [monthStr: string]: SlotsByDay | null };
  [OrgSubCollection.Attendance]: { [slotId: string]: SlotAttendnace };
}

export interface FirestoreOrdered {
  [Collection.Organizations]: { id: string; admins: string[] }[];
  [OrgSubCollection.Customers]: Customer[];
  [OrgSubCollection.Attendance]: SlotAttendnace[];
  [OrgSubCollection.Bookings]: [CustomerBase];
  [BookingSubCollection.BookedSlots]: CustomerBookingEntry[];
  [OrgSubCollection.SlotsByDay]: Array<SlotsByDay & { id: string }>;
  [OrgSubCollection.Attendance]: SlotAttendnace[];
}

// ***** End Region In-Store Firebase Date Scheme ***** //
