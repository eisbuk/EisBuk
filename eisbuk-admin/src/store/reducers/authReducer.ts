import { constants } from "react-redux-firebase";

import { Action } from "@/enums/Redux";

import { AuthInfoEisbuk } from "@/types/store";

const initState = {
  amIAdmin: false,
  myUserId: null,
  uid: null,
};

interface AuthAction {
  type: Action;
  payload?: Partial<AuthInfoEisbuk>;
}

export const authReducer = (
  state: AuthInfoEisbuk = initState,
  { type, payload }: AuthAction
): AuthInfoEisbuk => {
  switch (type) {
    case Action.IsAdminReceived:
      return {
        ...state,
        ...payload,
        myUserId: payload?.uid || null,
      };
    case constants.actionTypes.LOGOUT: // Reset state on logout
      return initState;
    default:
      return state;
  }
};

export default authReducer;
