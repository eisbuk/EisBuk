import {
  legacy_createStore as createStore,
  Store,
  combineReducers,
  applyMiddleware,
} from "redux";
import thunk from "redux-thunk";

import { GlobalStateFragment } from "../types";

import firestore from "../reducer";
import { DateTime } from "luxon";

/**
 * Creates a test store resembling one used in production. It features a store chunk
 * including `firestore` entry housing the state and a reducer for our functionality.
 */
export const getTestStore = (): Store<GlobalStateFragment> =>
  createStore(
    combineReducers({
      firestore,
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
