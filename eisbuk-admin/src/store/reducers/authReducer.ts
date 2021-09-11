import { constants } from "react-redux-firebase";

import { Action } from "@/enums/store";

import { AuthInfoEisbuk, AuthReducerAction, AuthAction } from "@/types/store";

export const defaultState = {
  admins: [],
  myUserId: null,
  uid: null,
};

export const authReducer = (
  state: AuthInfoEisbuk = defaultState,
  action: AuthReducerAction<AuthAction>
): AuthInfoEisbuk => {
  switch (action.type) {
    case Action.IsOrganizationStatusReceived:
      // get currectly typed payload
      const {
        payload,
      } = action as AuthReducerAction<Action.IsOrganizationStatusReceived>;

      // update state with newly received auth object
      return {
        ...state,
        ...payload,
        myUserId: payload?.uid || null,
      };

    case constants.actionTypes.LOGOUT:
      // Reset state on logout
      return defaultState;

    default:
      return state;
  }
};

export default authReducer;
