import { LocalStore } from "@/types/store";
import {
  legacy_createStore as createStore,
  applyMiddleware,
  Store,
  combineReducers,
} from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import thunk from "redux-thunk";
import { getFirestore as getClientFirestore } from "@firebase/firestore";

import { createFirestoreReducer } from "@eisbuk/react-redux-firebase-firestore";

import { ModalState } from "@/features/modal/types";

import { createAppReducer } from "./reducers/appReducer";
import { createAuthReducer } from "./reducers/authReducer";
import { createCopyPasteReducer } from "./reducers/copyPasteReducer";
import { createModalReducer } from "@/features/modal/reducer";
import { createNotificationsReducer } from "@/features/notifications/reducer";
import { FirestoreVariant } from "@/utils/firestore";

// Create Redux Store with Reducers and Initial state
const middlewares = [
  // We're adding an extra 'getFirestore' argument to the thunk middleware so that
  // we can use it as dependency injection in tests, rather than mocking.
  //
  // Furthermore, the returned object is not firestore object itself, but a FirestoreVariant, used to
  // be able to accept different firestore implementations (client SDK, node SDK and compat) and use them in a uniform way.
  // Here, in the client app, we're passing a client SDK variant, but tests might pass a different one when testing the thunks themeslves.
  thunk.withExtraArgument({
    getFirestore: () =>
      FirestoreVariant.client({ instance: getClientFirestore() }),
  }),
];

type InitialState = Partial<{
  [key in keyof LocalStore]: Partial<LocalStore[key]>;
}>;

/**
 * Our store creator function. It returns a store with the setup we're using in production
 * but it being a function is a convenience when testing so we can create a new instance of the store
 * (with default state for each test)
 * @returns a new store set up for our app
 */
export const getNewStore = (
  initialState: InitialState = {}
): Store<LocalStore> =>
  createStore(
    combineReducers({
      firestore: createFirestoreReducer(initialState.firestore),
      app: createAppReducer(initialState.app),
      copyPaste: createCopyPasteReducer(initialState.copyPaste),
      auth: createAuthReducer(initialState.auth),
      modal: createModalReducer(initialState.modal as ModalState),
      notifications: createNotificationsReducer(initialState.notifications),
    }),
    {},
    composeWithDevTools(applyMiddleware(...middlewares))
  );
