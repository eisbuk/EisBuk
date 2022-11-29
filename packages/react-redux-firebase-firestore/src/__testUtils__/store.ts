import {
  legacy_createStore as createStore,
  Store,
  combineReducers,
  applyMiddleware,
} from "redux";
import thunk from "redux-thunk";
import { DateTime } from "luxon";

import { GlobalStateFragment } from "../types";

import { createFirestoreReducer } from "../reducer";

/**
 * Creates a test store resembling one used in production. It features a store chunk
 * including `firestore` entry housing the state and a reducer for our functionality.
 */
export const getTestStore = (): Store<GlobalStateFragment> =>
  createStore(
    combineReducers({
      firestore: createFirestoreReducer(),
      /** This is extremely @TEMP and should not matter when we make this more generic use case */
      app: (state = { calendarDay: DateTime.now() }, action) => {
        if (action.type === "@@Eisbuk/CHANGE_DAY") {
          return { calendarDay: action.payload };
        }
        return state;
      },
    }),
    applyMiddleware(thunk)
  );
