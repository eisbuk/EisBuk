// import { CollectionReference, getFirestore } from "@firebase/firestore";
import { getAuth, User } from "@firebase/auth";
import i18n from "i18next";

import { AuthStatus } from "eisbuk-shared";

import { getOrganization } from "@/lib/getters";

import { Action, NotifVariant } from "@/enums/store";
import { CloudFunction } from "@/enums/functions";

import { AuthReducerAction, FirestoreThunk } from "@/types/store";

import { enqueueNotification } from "@/store/actions/appActions";
import { createCloudFunctionCaller } from "@/utils/firebase";

/**
 * Creates firestore async thunk:
 * - dispatches signout request to firestore
 * - enqueues success/error snackbar depending on the outcome of firestore operation
 * @returns async thunk
 */
export const signOut = (): FirestoreThunk => async (dispatch) => {
  try {
    const auth = getAuth();

    await auth.signOut();

    dispatch(
      enqueueNotification({
        key: new Date().getTime() + Math.random(),
        message: i18n.t("Notification.LogoutSuccess"),
        options: {
          variant: NotifVariant.Success,
        },
      })
    );
  } catch (err) {
    dispatch(
      enqueueNotification({
        key: new Date().getTime() + Math.random(),
        message: i18n.t("Notification.LogoutError"),
        options: {
          variant: NotifVariant.Error,
        },
      })
    );
  }
};

/**
 * Checks admin status locally (against organization in local store)
 * @param authString email or phone for which to check against organization's admins
 * @param orgsInStore organizations in local store against which to check
 * @returns isAdmin
 */
export const checkAuthStatus = async (
  authString: string
): Promise<AuthStatus> => {
  const organization = getOrganization();

  // fail early if no auth string
  if (!authString) {
    return { isAdmin: false };
  }

  const res = await createCloudFunctionCaller(CloudFunction.QueryAuthStatus, {
    organization,
    authString,
  })();

  return res.data;
};
/**
 * An update user callback, called by firestore's `onAuthStateChanged`.
 * Gets passed a new user, determines the `isAuthenticated` and `isAdmin` state,
 * dispatches the updates to store.
 * @param user new user (if authenticated) or null if not authenticated as a user in our firebase auth record
 * @returns a firestore thunk dispatching appropriate updates to the store
 */
export const updateAuthUser =
  (user: User | null): FirestoreThunk =>
  async (dispatch) => {
    // stop early (and log out) if no user recieved
    if (!user) {
      dispatch({ type: Action.Logout });
      return;
    }

    const { email, phoneNumber } = user;

    const authStatus = await checkAuthStatus(email || phoneNumber || "");

    dispatch({
      type: Action.UpdateAuthInfo,
      payload: {
        ...authStatus,
        userData: user,
        isEmpty: false,
        isLoaded: true,
      },
    } as AuthReducerAction<Action.UpdateAuthInfo>);
  };
