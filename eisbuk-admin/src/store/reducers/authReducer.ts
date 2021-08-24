import { constants } from "react-redux-firebase";

import { Action } from "@/enums/store";

import { AuthInfoEisbuk, AuthReducerAction, AuthAction } from "@/types/store";

const initState = {
  admins: [],
  myUserId: null,
  uid: null,
};

export const authReducer = (
  state: AuthInfoEisbuk = initState,
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
      return initState;

    default:
      return state;
  }
};

export default authReducer;
