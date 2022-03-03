import { Action } from "@/enums/store";

import {
  AuthState,
  AuthReducerAction,
  AuthAction,
  LocalStore,
} from "@/types/store";

export const defaultState: LocalStore["auth"] = {
  userData: null,
  isAdmin: false,
  isEmpty: true,
  isLoaded: false,
};

/**
 * A simple reducer used to save firebase auth state to store
 * @param state
 * @param action
 * @returns
 */
export const authReducer = (
  state: AuthState = defaultState,
  action: AuthReducerAction<AuthAction>
): AuthState => {
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

export default authReducer;
