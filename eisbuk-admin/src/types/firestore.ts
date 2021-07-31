/* eslint-disable camelcase */
import {
  Collection,
  OrgSubCollection,
  BookingSubCollection,
  OrganizationMeta,
  SlotsByDay,
  Customer,
  BookingsMeta,
  BookingInfo,
  BookingsByDay,
} from "eisbuk-shared";

// ***** Region In-Store Firebase Date Scheme ***** //
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

// ***** End Region In-Store Firebase Date Scheme ***** //
