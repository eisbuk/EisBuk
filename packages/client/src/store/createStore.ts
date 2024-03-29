import { LocalStore, ThunkExtraArgument } from "@/types/store";
import {
  legacy_createStore as createStore,
  applyMiddleware,
  Store,
  combineReducers,
} from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import thunk from "redux-thunk";

import { createFirestoreReducer } from "@eisbuk/react-redux-firebase-firestore";

import { ModalState } from "@/features/modal/types";

import { createAppReducer } from "./reducers/appReducer";
import { createAuthReducer } from "./reducers/authReducer";
import { createCopyPasteReducer } from "./reducers/copyPasteReducer";
import { createModalReducer } from "@/features/modal/reducer";
import { createNotificationsReducer } from "@/features/notifications/reducer";

// Create Redux Store with Reducers and Initial state
const constructMiddleware = (extraArgument?: ThunkExtraArgument) => [
  ...(extraArgument ? [thunk.withExtraArgument(extraArgument)] : []),
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
  initialState: InitialState = {},
  extraArgument?: ThunkExtraArgument
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
    composeWithDevTools(applyMiddleware(...constructMiddleware(extraArgument)))
  );
