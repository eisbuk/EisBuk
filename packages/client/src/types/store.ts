/* eslint-disable @typescript-eslint/ban-types */
import { DateTime } from "luxon";
import { Dispatch } from "redux";

import { User } from "@firebase/auth";

import {
  AuthStatus,
  SlotInterface,
  SlotsByDay,
  SlotsById,
} from "@eisbuk/shared";
import { FirestoreState } from "@eisbuk/react-redux-firebase-firestore";

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
