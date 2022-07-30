/* eslint-disable @typescript-eslint/ban-types */
import { DateTime } from "luxon";
import { Dispatch } from "redux";

import { Unsubscribe, DocumentData } from "@firebase/firestore";
import { User } from "@firebase/auth";

import {
  AuthStatus,
  BookingSubCollection,
  CalendarEvents,
  Collection,
  Customer,
  CustomerBase,
  CustomerBookingEntry,
  OrganizationData,
  OrgSubCollection,
  SlotAttendnace,
  SlotInterface,
  SlotsByDay,
  SlotsById,
} from "@eisbuk/shared";

import { ModalState } from "@/features/modal/types";
import { NotificationsState } from "@/features/notifications/types";

import { Action } from "@/enums/store";
import { CustomerRoute } from "@/enums/routes";

// #region app
/**
 * Whitelisted actions for app reducer
 */
export type AppAction = Action.ChangeDay;

/**
 * Record of payloads for each of the app reducer actions
 */
interface AppActionPayload {
  [Action.ChangeDay]: DateTime;
}
/**
 * App reducer action generic
 * gets passed one of whitelisted app reducer actions as type parameter
 */
export interface AppReducerAction<A extends AppAction> {
  type: A;
  payload: AppActionPayload[A];
}
/**
 * `app` portion of the local store
 */
export interface AppState {
  notifications: Notification[];
  calendarDay: DateTime;
}
// #endregion app

// #region authInfoEisbuk
/**
 * Whitelisted actions for auth reducer
 */
export type AuthAction =
  | Action.UpdateAuthInfo
  | Action.Logout
  | Action.UpdateAdminStatus;

/**
 * Auth reducer action generic
 * gets passed one of whitelisted auth reducer actions as type parameter
 */
export type AuthReducerAction<A extends AuthAction> =
  A extends Action.UpdateAuthInfo
    ? {
        type: A;
        payload: AuthState;
      }
    : A extends Action.UpdateAdminStatus
    ? { type: A; payload: boolean }
    : { type: string };
/**
 * `authInfoEisbuuk` portion of the local store
 */
export interface AuthState extends AuthStatus {
  userData: User | null;
  isEmpty: boolean;
  isLoaded: boolean;
}
// #endregion authInfoEisbuk

// #region copyPaste
/**
 * `week` portion of `copyPaste` portion of the local store
 */
export interface SlotsWeek {
  weekStart: DateTime;
  slots: SlotInterface[];
}
/**
 * Whitelisted actions for copy paste reducer
 */
export type CopyPasteAction =
  | Action.CopySlotDay
  | Action.CopySlotWeek
  | Action.DeleteSlotFromClipboard
  | Action.AddSlotToClipboard;
/**
 * Record of payloads for each of the copy paste reducer actions
 */
interface CopyPastePayload {
  [Action.CopySlotDay]: CopyPasteState["day"];
  [Action.CopySlotWeek]: CopyPasteState["week"];
  [Action.DeleteSlotFromClipboard]: SlotInterface["id"];
  [Action.AddSlotToClipboard]: SlotInterface;
}
/**
 * Copy Paste reducer action generic
 * gets passed one of whitelisted copy paste reducer actions as type parameter
 */
export interface CopyPasteReducerAction<A extends CopyPasteAction> {
  type: A;
  payload: CopyPastePayload[A];
}
/**
 * `copyPaste` portion of the local store
 */
export interface CopyPasteState {
  day: SlotsById | null;
  week: SlotsWeek | null;
}
// #endregion copyPaste

// #region firestore
/**
 * `firestore.data` structure in local store
 */
export interface FirestoreData {
  [Collection.Organizations]: { [organization: string]: OrganizationData };
  [OrgSubCollection.Customers]: { [customerId: string]: Customer };
  [OrgSubCollection.Bookings]: {
    /** This is @TEMP make this only one entry (without secretKey) when we add 'transform' functionality to firestore subscribe */
    [secretKey: string]: CustomerBase;
  };
  [BookingSubCollection.BookedSlots]: {
    [slotId: string]: CustomerBookingEntry;
  };
  [BookingSubCollection.Calendar]: CalendarEvents;
  [OrgSubCollection.SlotsByDay]: { [monthStr: string]: SlotsByDay } | null;
  [OrgSubCollection.Attendance]: { [slotId: string]: SlotAttendnace };
  [Collection.PublicOrgInfo]: {
    [organization: string]: Pick<
      OrganizationData,
      "displayName" | "location" | "emailFrom"
    >;
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
 */
export type CollectionSubscription =
  | Collection.Organizations
  | Collection.PublicOrgInfo
  | OrgSubCollection.SlotsByDay
  | OrgSubCollection.Customers
  | OrgSubCollection.Bookings
  | OrgSubCollection.Attendance
  | BookingSubCollection.BookedSlots
  | BookingSubCollection.Calendar;
/**
 * Whitelisted actions for firestore reducer
 */
export type FirestoreAction =
  | Action.UpdateFirestoreListener
  | Action.DeleteFirestoreListener
  | Action.UpdateLocalDocuments
  | Action.DeleteLocalDocuments;
/**
 * Record of payloads for each of the firestore reducer actions
 */
interface FirestorReducerPayload {
  [Action.UpdateLocalDocuments]: {
    collection: string;
    data: DocumentData;
  };
  [Action.DeleteLocalDocuments]: {
    collection: string;
    ids: string[];
  };
  [Action.UpdateFirestoreListener]: {
    collection: CollectionSubscription;
    listener: Partial<FirestoreListener>;
  };
  [Action.DeleteFirestoreListener]: CollectionSubscription;
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
  listeners: { [index in CollectionSubscription]?: FirestoreListener };
};
// #endregion firestore

// #region thunks
type GetState = () => LocalStore;
/**
 * Async Thunk in charge of updating the firestore and dispatching action
 * to local store with respect to firestore update outcome
 */
export interface FirestoreThunk {
  (dispatch: Dispatch<any>, getState: GetState): Promise<void>;
}

// #endregion thunks

// #region FullStore
export interface LocalStore {
  firestore: FirestoreState;
  app: AppState;
  copyPaste: CopyPasteState;
  auth: AuthState;
  modal: ModalState;
  notifications: NotificationsState;
}
// #endregion FullStore

// #region mappedValues
export interface SlotsByCustomerRoute<S extends SlotsById | SlotsByDay> {
  [CustomerRoute.BookIce]: S;
  [CustomerRoute.BookOffIce]: S;
  [CustomerRoute.Calendar]: S extends SlotsById ? undefined : SlotsById;
}
// #endregion mappedValues
