/* eslint-disable @typescript-eslint/ban-types */
import { FirebaseReducer } from "react-redux-firebase";
import { DateTime } from "luxon";
import { SnackbarKey, TransitionCloseHandler } from "notistack";
import { Timestamp } from "@google-cloud/firestore";
import firebase from "firebase";

import { Customer, Slot } from "eisbuk-shared";

import { store } from "@/store";

import { NotifVariant } from "@/enums/Redux";

import {
  FirestoreStatusEntry,
  FirestoreData,
  FirestoreOrdered,
} from "@/types/firestore";

// ***** Region Store Types ***** //
export type Dispatch = typeof store.dispatch;
export type GetState = typeof store.getState;
// ***** End Region Store Types ***** //

// ***** Region App ***** //
export interface AppState {
  notifications: Notification[];
  calendarDay: DateTime;
  newSlotTime: Timestamp | null;
}
// ***** End Region App ***** //

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

// ***** Region Notification ***** //
export interface Notification {
  key?: SnackbarKey;
  message: string;
  options: {
    variant?: NotifVariant;
    action?: (key: number) => JSX.Element;
    onClose?: TransitionCloseHandler;
  };
  dismissed?: boolean;
}
// ***** End Region Notifiaction ***** //

// ***** Region Firebase Reducer ***** //
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ProfileType {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Schema {}
// ***** End Region Firebase Reducer ***** //

// ****** Region Firestore ***** //
export interface GetFirebase {
  getFirebase: () => typeof firebase;
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

// ****** Region Auth Info ***** //
export interface AuthInfoEisbuk {
  amIAdmin: boolean;
  myUserId: string | null;
  uid: string | null;
}
// ****** End Region Auth Info ***** //

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
