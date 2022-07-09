import {
  legacy_createStore as createStore,
  Store,
  combineReducers,
  applyMiddleware,
} from "redux";
import thunk from "redux-thunk";

import { GlobalStateFragment } from "../types";

import firestore from "../reducer";

/**
 * Creates a test store resembling one used in production. It features a store chunk
 * including `firestore` entry housing the state and a reducer for our functionality.
 */
export const getTestStore = (): Store<GlobalStateFragment> =>
  createStore(combineReducers({ firestore }), applyMiddleware(thunk));
