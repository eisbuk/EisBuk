import { Dispatch } from "redux";

import { Unsubscribe, DocumentData } from "@firebase/firestore";

import {
  Collection,
  OrgSubCollection,
  BookingSubCollection,
  Customer,
  CustomerBookingEntry,
  CalendarEvents,
  SlotsByDay,
  SlotAttendnace,
  OrganizationData,
  PublicOrganizationData,
} from "@eisbuk/shared";

import { FirestoreAction } from "./enums";
import { DateTime } from "luxon";

/**
 * Global state can be arbitrary, but it should contain
 * firestore state under `firestore` property for this package to work properly
 */
export interface GlobalStateFragment {
  firestore: FirestoreState;
}

type GetState = () => GlobalStateFragment;

/** Metadata for subscriptions (this is stored in listener state and used by different utils to get colleciton path, constaint, etc.) */
export interface SubscriptionMeta {
  organization: string;
  secretKey?: string;
  currentDate: DateTime;
}

/**
 * Async Thunk in charge of updating the firestore and dispatching action
 * to local store with respect to firestore update outcome
 */
export interface FirestoreThunk {
  (dispatch: Dispatch<any>, getState: GetState): Promise<void>;
}

/**
 * `firestore.data` structure in local store
 * @TEMP this shouldn't matter in a more generic approach
 */
export interface FirestoreData {
  [Collection.Organizations]: { [organization: string]: OrganizationData };
  [OrgSubCollection.Customers]: { [customerId: string]: Customer };
  [OrgSubCollection.Bookings]: {
    /** This is @TEMP make this only one entry (without secretKey) when we add 'transform' functionality to firestore subscribe */
    [secretKey: string]: Omit<Customer, "secretKey">;
  };
  [BookingSubCollection.BookedSlots]: {
    [slotId: string]: CustomerBookingEntry;
  };
  [BookingSubCollection.AttendedSlots]: {
    [slotId: string]: Omit<CustomerBookingEntry, "bookingNotes">;
  };
  [BookingSubCollection.Calendar]: CalendarEvents;
  [OrgSubCollection.SlotsByDay]: { [monthStr: string]: SlotsByDay } | null;
  [OrgSubCollection.Attendance]: { [slotId: string]: SlotAttendnace };
  [Collection.PublicOrgInfo]: {
    [organization: string]: PublicOrganizationData;
  };
}
/**
 * Entry for a particular listener in `firestore` portion of local store
 */
export interface FirestoreListener {
  /**
   * A list of all consumer ids (hook instances subscribed to a particlar firestore listener)
   */
  consumers: string[];
  /**
   * A function returned from firebase `onSnapshot` listener, used to unsubscribe from particular collection.
   * When paginating through (adding more subscription entries) this function gets compositioned into a new one,
   * thus on `unsubscribe()` call we're unsubscribing from all subscriptions for a given collection.
   */
  unsubscribe: Unsubscribe;
  /**
   * A range for which we're subscribing.
   * @example
   * ```
   * ["date", "2021-01-01", "2022-01-01"]
   * // subscribes to
   * query(
   *  collectionRef,
   *  where("date", ">=", "2021-01-01"),
   *  where("date", "<=", "2022-01-01"),
   * )
   * ```
   */
  range?: [string, string, string];
  /**
   * Metadata of the subscription, such as 'orgnaization' name, 'secretKey', date, etc.
   */
  meta: SubscriptionMeta;
  /**
   * Document id's we're subscribing to (i.e. `slostByDay` month entries)
   * @example
   * ```
   * ["2021-01", "2021-02"]
   * ```
   */
  documents?: string[];
  /** @TODO add additional meta functionality (for reporting) here */
}

/**
 * A whitelist of collections we can add a firebase subscrption for
 * @TEMP this should just be strings to make the package more generic
 */
export type SubscriptionWhitelist =
  | Collection.Organizations
  | Collection.PublicOrgInfo
  | OrgSubCollection.SlotsByDay
  | OrgSubCollection.Customers
  | OrgSubCollection.Bookings
  | OrgSubCollection.Attendance
  | BookingSubCollection.BookedSlots
  | BookingSubCollection.AttendedSlots
  | BookingSubCollection.Calendar;

export type CollectionSubscription =
  | {
      collection: Exclude<
        SubscriptionWhitelist,
        OrgSubCollection.Bookings | BookingSubCollection
      >;
      meta?: Record<string, any>;
    }
  | {
      collection: OrgSubCollection.Bookings | BookingSubCollection;
      meta: { secretKey: string };
    };

/**
 * Record of payloads for each of the firestore reducer actions
 */
interface FirestorReducerPayload {
  [FirestoreAction.UpdateLocalDocuments]: {
    collection: string;
    data: DocumentData;
  };
  [FirestoreAction.DeleteLocalDocuments]: {
    collection: string;
    ids: string[];
  };
  [FirestoreAction.UpdateFirestoreListener]: {
    collection: SubscriptionWhitelist;
    listener: Partial<FirestoreListener>;
  };
  [FirestoreAction.DeleteFirestoreListener]: SubscriptionWhitelist;
}
/**
 * Copy Paste reducer action generic
 * gets passed one of whitelisted copy paste reducer actions as type parameter
 */
export interface FirestoreReducerAction<A extends FirestoreAction> {
  type: A;
  payload: FirestorReducerPayload[A];
}
/**
 * `firestore` portion of the local store
 */
export type FirestoreState = {
  data: Partial<FirestoreData>;
  listeners: { [index in SubscriptionWhitelist]?: FirestoreListener };
};
