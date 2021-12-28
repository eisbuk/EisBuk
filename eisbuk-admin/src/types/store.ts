/* eslint-disable @typescript-eslint/ban-types */
import { DateTime } from "luxon";
import { SnackbarKey, TransitionCloseHandler } from "notistack";
import { Dispatch } from "redux";

import { Unsubscribe } from "@firebase/firestore";
import { User } from "@firebase/auth";

import {
  BookingSubCollection,
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
} from "eisbuk-shared";

import { Action, NotifVariant } from "@/enums/store";
import { CustomerRoute } from "@/enums/routes";

// #region app
/**
 * Notification interface used to enqueue notification snackbar
 */
export interface Notification {
  key: SnackbarKey;
  message: string;
  closeButton?: boolean;
  options?: {
    variant?: NotifVariant;
    onClose?: TransitionCloseHandler;
  };
  dismissed?: boolean;
}
/**
 * Whitelisted actions for app reducer
 */
export type AppAction =
  | Action.EnqueueNotification
  | Action.RemoveNotification
  | Action.CloseSnackbar
  | Action.ChangeDay;

/**
 * Record of payloads for each of the app reducer actions
 */
interface AppActionPayload {
  [Action.EnqueueNotification]: Notification;
  [Action.RemoveNotification]: SnackbarKey;
  [Action.CloseSnackbar]?: SnackbarKey;
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
export interface AuthState {
  userData: User | null;
  isAdmin: boolean;
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
  [OrgSubCollection.Bookings]: CustomerBase;
  [BookingSubCollection.BookedSlots]: {
    [slotId: string]: CustomerBookingEntry;
  };
  [OrgSubCollection.SlotsByDay]: { [monthStr: string]: SlotsByDay } | null;
  [OrgSubCollection.Attendance]: { [slotId: string]: SlotAttendnace };
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
   * A function returned from firebase `onSnapshot` listener, used to unsubscribe from particular collection
   */
  unsubscribe: Unsubscribe;
  /** @TODO add additional meta functionality (for reporting) here */
}
/**
 * A whitelist of collections we can add a firebase subscrption for
 */
export type CollectionSubscription =
  | Collection.Organizations
  | OrgSubCollection.SlotsByDay
  | OrgSubCollection.Customers
  | OrgSubCollection.Bookings
  | OrgSubCollection.Attendance;
/**
 * Whitelisted actions for firestore reducer
 */
export type FirestoreAction =
  | Action.UpdateFirestoreListener
  | Action.DeleteFirestoreListener
  | Action.UpdateLocalCollection;
/**
 * A generic used to type the payload we'll recieve from UpdateLocalCollection action
 */
export interface UpdateFirestoreDataPayload<
  C extends CollectionSubscription | BookingSubCollection.BookedSlots
> {
  collection: C;
  data: FirestoreData[C];
  merge?: boolean;
}
/**
 * Record of payloads for each of the firestore reducer actions
 */
interface FirestorReducerPayload {
  [Action.UpdateLocalCollection]: UpdateFirestoreDataPayload<CollectionSubscription>;
  [Action.UpdateFirestoreListener]: FirestoreListener;
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
}
// #endregion FullStore

// #region mappedValues
export interface SlotsByCustomerRoute<S extends SlotsById | SlotsByDay> {
  [CustomerRoute.BookIce]: S;
  [CustomerRoute.BookOffIce]: S;
  [CustomerRoute.Calendar]: S extends SlotsById ? undefined : SlotsById;
}
// #endregion mappedValues
