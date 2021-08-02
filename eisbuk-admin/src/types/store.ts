/* eslint-disable @typescript-eslint/ban-types */
import { FirebaseReducer } from "react-redux-firebase";
import { DateTime } from "luxon";
import { SnackbarKey, TransitionCloseHandler } from "notistack";
import { Timestamp } from "@google-cloud/firestore";
import firebase from "firebase";

import { Customer, Slot } from "eisbuk-shared";

import { Action, NotifVariant } from "@/enums/store";

import { store } from "@/store";

import {
  FirestoreStatusEntry,
  FirestoreData,
  FirestoreOrdered,
} from "@/types/firestore";

// ***** Region App Reducer ***** //
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
  newSlotTime: Timestamp | null;
}
// ***** End Region App ***** //

// ****** Region Auth Reducer ***** //
/**
 * In store auth info object
 */
export interface AuthInfoEisbuk {
  amIAdmin: boolean;
  myUserId: string | null;
  uid: string | null;
}

/**
 * Whitelisted actions for app reducer
 */
export type AuthAction = Action.IsAdminReceived | string;

/**
 * App reducer action generic
 * gets passed one of whitelisted app reducer actions as type parameter
 */
export type AuthReducerAction<
  A extends AuthAction
> = A extends Action.IsAdminReceived
  ? {
      type: Action.IsAdminReceived;
      payload?: Omit<AuthInfoEisbuk, "myUserId">;
    }
  : { type: string };
// ****** End Region Auth Info ***** //

// ***** Region Copy Paste ***** //
export interface SlotDay {
  [slotId: string]: Slot<"id">;
}

export interface SlotWeek {
  weekStart: DateTime;
  slots: Slot<"id">[];
}

export interface CopyPasteState {
  day: SlotDay | null;
  week: SlotWeek | null;
}
// ***** End Region Copy Paste ***** //

// ***** Region Firebase Reducer ***** //
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ProfileType {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Schema {}
// ***** End Region Firebase Reducer ***** //

// ****** Region Firestore ***** //
type Dispatch = typeof store.dispatch;
type GetState = typeof store.getState;

interface FirestoreGetters {
  getFirebase: () => typeof firebase;
}

/**
 * Async Thunk in charge of updating the firestore and dispatching action
 * to local store with respect to firestore update outcome
 */
export interface FirestoreThunk {
  (
    dispatch: Dispatch,
    getState: GetState,
    firebaseParams: FirestoreGetters
  ): Promise<void>;
}

interface FirestoreRedux {
  status: {
    requesting: FirestoreStatusEntry<boolean>;
    requested: FirestoreStatusEntry<boolean>;
    timestamps: FirestoreStatusEntry<number>;
  };
  data: FirestoreData;
  ordered: FirestoreOrdered;
  listeners: {
    byId: {};
    allIds: [];
  };
  errors: {
    byQuery: {};
    allIds: [];
  };
  queries: {};
}
// ****** Region Firestore ***** //

// ****** Region Full Store ***** //
export interface LocalStore {
  firebase: FirebaseReducer.Reducer<ProfileType, Schema>;
  firestore: FirestoreRedux;
  app: AppState;
  copyPaste: CopyPasteState;
  authInfoEisbuk: AuthInfoEisbuk;
}
// ****** End Region Full Store ***** //

// ****** Region Other ***** //
export type CustomerInStore = Pick<Customer, "id"> &
  Pick<Customer, "name"> &
  Pick<Customer, "surname">;
// ****** End Region Other ***** //
