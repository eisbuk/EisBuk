import { getAuth, User } from "@firebase/auth";
import { Functions } from "@firebase/functions";

import i18n, { NotificationMessage } from "@eisbuk/translations";
import { AuthStatus } from "@eisbuk/shared";
import { CloudFunction } from "@eisbuk/shared/ui";

import { getOrganization } from "@/lib/getters";

import { Action, NotifVariant } from "@/enums/store";

import { AuthReducerAction, FirestoreThunk } from "@/types/store";

import { enqueueNotification } from "@/features/notifications/actions";

import { createFunctionCaller } from "@/utils/firebase";

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
        message: i18n.t(NotificationMessage.LogoutSuccess),
        variant: NotifVariant.Success,
      })
    );
  } catch (err) {
    dispatch(
      enqueueNotification({
        message: i18n.t(NotificationMessage.LogoutError),
        variant: NotifVariant.Error,
      })
    );
  }
};

/**
 * Dispatches a cloud function to determine auth status for user
 * @param authString email or phone for which to check auth status
 * @returns promise resolving to auth status object `{isAdmin, bookingsSecretKey?}`
 */
export const checkAuthStatus = async (
  functions: Functions,
  authString: string
): Promise<AuthStatus> => {
  const organization = getOrganization();

  // fail early if no auth string
  if (!authString) {
    return { isAdmin: false, secretKeys: [] };
  }

  const res = await createFunctionCaller(
    functions,
    CloudFunction.QueryAuthStatus,
    {
      organization,
    }
  )();

  return res.data;
};

/**
 * An update user callback, called by firestore's `onAuthStateChanged`.
 * Gets passed a new user, determines the auth status (`isAdmin`, `bookingsSecretKey`),
 * updates the auth state in redux store
 * @param user new user (if authenticated) or null if not authenticated as a user in our firebase auth record
 * @returns a firestore thunk dispatching appropriate updates to the store
 */
export const updateAuthUser =
  (user: User | null): FirestoreThunk =>
  async (dispatch, _, { getFunctions }) => {
    // stop early (and log out) if no user recieved
    if (!user) {
      dispatch({ type: Action.Logout });
      return;
    }

    const { email, phoneNumber } = user;

    const authStatus = await checkAuthStatus(
      getFunctions(),
      email || phoneNumber || ""
    );

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
