import { Action } from "@/enums/store";

import {
  AuthState,
  AuthReducerAction,
  AuthAction,
  ReducerFactory,
} from "@/types/store";

const defaultState: AuthState = {
  userData: null,
  isAdmin: false,
  isEmpty: true,
  isLoaded: false,
};

/**
 * A factory function returning a redux reducer for `auth` state.
 * It is created using a factory rather than just creating the reducer as a variable
 * to enable us to pass `initialState`
 *
 * @param initialState (optional) state to be used as initial (fallback) state to the reducer. If not provided,
 * falls back to a locally defined `defaultState`.
 */
export const createAuthReducer: ReducerFactory<
  AuthState,
  AuthReducerAction<AuthAction>
> =
  (initialState = {}) =>
  (state = { ...defaultState, ...initialState }, action) => {
    switch (action.type) {
      // ran on firebase auth state change with new user recieved
      case Action.UpdateAuthInfo:
        return (action as AuthReducerAction<Action.UpdateAuthInfo>).payload;
      // ran on admin state revalidataion when the organization data in store changes
      case Action.UpdateAdminStatus:
        return {
          ...state,
          isAdmin: (action as AuthReducerAction<Action.UpdateAdminStatus>)
            .payload,
        };
      // ran on firebase auth state change without user recieved (logout)
      case Action.Logout:
        // we need an empty state (default) only this time the auth is loaded
        return { ...defaultState, isLoaded: true };
      default:
        return state;
    }
  };
