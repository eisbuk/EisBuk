/* eslint-disable @typescript-eslint/ban-types */
import {
  ExtendedFirebaseInstance,
  FirebaseReducer,
} from "react-redux-firebase";
import { DateTime } from "luxon";
import { SnackbarKey, TransitionCloseHandler } from "notistack";
import { Timestamp } from "@google-cloud/firestore";

import { SlotInterface, SlotsByDay, SlotsById } from "eisbuk-shared";

import { Action, NotifVariant } from "@/enums/store";

import { store } from "@/store";

import {
  FirestoreStatusEntry,
  FirestoreData,
  FirestoreOrdered,
} from "@/types/firestore";
import { CustomerRoute } from "@/enums/routes";

// #region App Reducer
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
  | Action.ChangeDay
  | Action.SetSlotTime;

/**
 * Record of payloads for each of the app reducer actions
 */
interface AppActionPayload {
  [Action.EnqueueNotification]: Notification;
  [Action.RemoveNotification]: SnackbarKey;
  [Action.CloseSnackbar]?: SnackbarKey;
  [Action.ChangeDay]: DateTime;
  [Action.SetSlotTime]: Timestamp;
}

/**
 * App reducer action generic
 * gets passed one of whitelisted app reducer actions as type parameter
 */
export interface AppReducerAction<A extends AppAction> {
  type: A;
  payload: AppActionPayload[A];
}

export interface AppState {
  notifications: Notification[];
  calendarDay: DateTime;
}
// #endregion Region App

// #region Auth
/**
 * In store auth info object
 */
export interface AuthInfoEisbuk {
  admins: string[];
  myUserId: string | null;
  uid: string | null;
}

/**
 * Whitelisted actions for auth reducer
 */
export type AuthAction = Action.IsOrganizationStatusReceived | string;

/**
 * Auth reducer action generic
 * gets passed one of whitelisted auth reducer actions as type parameter
 */
export type AuthReducerAction<
  A extends AuthAction
> = A extends Action.IsOrganizationStatusReceived
  ? {
      type: Action.IsOrganizationStatusReceived;
      payload?: Omit<AuthInfoEisbuk, "myUserId">;
    }
  : { type: string };
// #endregion Region Auth

// #region copyPaste

export interface SlotsWeek {
  weekStart: DateTime;
  slots: SlotInterface[];
}

export interface CopyPasteState {
  day: SlotsById | null;
  week: SlotsWeek | null;
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
// #endregion Region Copy Paste

// #region Firebase Reducer
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ProfileType {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Schema {}
// #endregion Region Firebase Reducer

// #region Firestore
type Dispatch = typeof store.dispatch;
type GetState = () => LocalStore;

export interface FirebaseGetters {
  getFirebase: () => ExtendedFirebaseInstance;
}

/**
 * Async Thunk in charge of updating the firestore and dispatching action
 * to local store with respect to firestore update outcome
 */
export interface FirestoreThunk {
  (
    dispatch: Dispatch,
    getState: GetState,
    firebaseParams: FirebaseGetters
  ): Promise<void>;
}

type FirestoreRedux = {
  status: {
    requesting: FirestoreStatusEntry<boolean>;
    requested: FirestoreStatusEntry<boolean>;
    timestamps: FirestoreStatusEntry<number>;
  };
  data: Partial<FirestoreData>;
  ordered: Partial<FirestoreOrdered>;
  listeners: {
    byId: {};
    allIds: [];
  };
  errors: {
    byQuery: {};
    allIds: [];
  };
  queries: {};
};
// #region Firestore

// #region Full Store
export interface LocalStore {
  firebase: FirebaseReducer.Reducer<ProfileType, Schema>;
  firestore: FirestoreRedux;
  app: AppState;
  copyPaste: CopyPasteState;
  authInfoEisbuk: AuthInfoEisbuk;
}
// #endregion Region Full Store

// #region mappedValues
export interface SlotsByCustomerRoute<S extends SlotsById | SlotsByDay> {
  [CustomerRoute.BookIce]: S;
  [CustomerRoute.BookOffIce]: S;
  [CustomerRoute.Calendar]: S extends SlotsById ? undefined : SlotsById;
}
// #endregion mappedValues
