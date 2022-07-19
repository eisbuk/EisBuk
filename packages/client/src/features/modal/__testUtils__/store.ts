import { legacy_createStore as createStore, combineReducers } from "redux";

import modalReducer from "../reducer";

/**
 * User for testing, creates a store fragment with modal feature. The created
 * fragment resembles a store used in production, but with only a modal feature.
 */
export const createModalStoreFragment = () =>
  createStore(combineReducers({ modal: modalReducer }));
