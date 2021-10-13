import { Action } from "@/enums/store";

import { AuthState, AuthReducerAction, AuthAction } from "@/types/store";

export const defaultState = {
  firebase: {},
  info: {
    admins: [],
    myUserId: null,
    uid: null,
  },
};

export const authReducer = (
  state: AuthState = defaultState,
  action: AuthReducerAction<AuthAction>
): AuthState => {
  switch (action.type) {
    case Action.IsOrganizationStatusReceived:
      // get currectly typed payload
      const {
        payload,
      } = action as AuthReducerAction<Action.IsOrganizationStatusReceived>;

      // update state with newly received auth object
      return {
        ...state,
        info: {
          ...state.info,
          ...payload,
          myUserId: payload?.uid || null,
        },
      };

    // case constants.actionTypes.LOGOUT:
    //   // Reset state on logout
    //   return defaultState;

    default:
      return state;
  }
};

export default authReducer;
