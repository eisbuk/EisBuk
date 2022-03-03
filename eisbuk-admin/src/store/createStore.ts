import { LocalStore } from "@/types/store";
import { createStore, applyMiddleware, Store } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import thunk from "redux-thunk";

import rootReducer from "./reducers/rootReducer";

// Create Redux Store with Reducers and Initial state
const middlewares = [thunk];

/**
 * Our store creator function. It returns a store with the setup we're using in production
 * but it being a function is a convenience when testing so we can create a new instance of the store
 * (with default state for each test)
 * @returns a new store set up for our app
 */
export const getNewStore = (): Store<LocalStore> =>
  createStore(
    rootReducer,
    {},
    composeWithDevTools(applyMiddleware(...middlewares))
  );
