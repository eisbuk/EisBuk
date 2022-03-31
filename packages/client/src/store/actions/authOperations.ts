// import { CollectionReference, getFirestore } from "@firebase/firestore";
import { getAuth, User } from "@firebase/auth";
import i18n from "@eisbuk/translations";

import { getOrganization } from "@/lib/getters";
import { Collection } from "@eisbuk/shared";

import { Action, NotifVariant } from "@/enums/store";

import {
  FirestoreData,
  AuthReducerAction,
  FirestoreThunk,
} from "@/types/store";

import {
  enqueueNotification,
  // showErrSnackbar,
} from "@/store/actions/appActions";

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
 * Creates firestore async thunk:
 * - sends a query to firestore regarding admin status of the user
 * - on success updates admin status in local store
 * - on error enqueues error snackbar
 * @returns async thunk
 */
// export const queryOrganizationStatus = (): FirestoreThunk => async (
//   dispatch,
//   getState
// ) => {
//   try {
//     const db = getFirestore();

//     const orgRef = doc(db, `${Collection.Organizations}/${__organization__}`);
//     const res = await getDoc(orgRef);
//     const admins: string[] = res.data()?.admins ?? [];
//     const { uid } = (getState() as any).firebase.auth; /** @TODO_AUTH */

//     if (uid) {
//       dispatch(updateOrganizationStatus(uid, admins));
//     }
//   } catch (err) {
//     /** @TODO inform the user that the login was successful, but */
//     // they don't have permission to access
//     dispatch(showErrSnackbar);
//   }
// };

/**
 * Checks admin status locally (against organization in local store)
 * @param authString email or phone for which to check against organization's admins
 * @param orgsInStore organizations in local store against which to check
 * @returns isAdmin
 */
export const checkAdminStatus = (
  authString: string,
  orgsInStore?: FirestoreData[Collection.Organizations]
): boolean => {
  const organization = getOrganization();
  if (!authString || !orgsInStore) {
    // At least one of authString or orgsInStore is missing
    // hence the current user is not an admin
    return false;
  }
  if (!orgsInStore[organization]) {
    // The current organization is not in the local store
    return false;
  }
  return orgsInStore[organization].admins.includes(authString);
};
/**
 * An update user callback, called by firestore's `onAuthStateChanged`.
 * Get's passed a new user, determines the `isAuthenticated` and `isAdmin` state,
 * dispatches the updates to store.
 * @param user new user (if authenticated) or null if not authenticated as a user in our firebase auth record
 * @returns a firestore thunk dispatching appropriate updates to the store
 */
export const updateAuthUser =
  (user: User | null): FirestoreThunk =>
  async (dispatch, getState) => {
    // stop early (and log out) if not user recieved
    if (!user) {
      dispatch({ type: Action.Logout });
      return;
    }

    const orgsInStore = getState().firestore.data.organizations;
    const { email, phoneNumber } = user;

    const isAdmin = checkAdminStatus(email || phoneNumber || "", orgsInStore);

    dispatch({
      type: Action.UpdateAuthInfo,
      payload: { userData: user, isAdmin, isEmpty: false, isLoaded: true },
    } as AuthReducerAction<Action.UpdateAuthInfo>);
  };

/**
 * A thunk ran when the organization status is updated, reads the store state internally
 * and revalidates the auth user's admin status against updated organization.
 */
export const revalidateAdminStatus: FirestoreThunk = async (
  dispatch,
  getState
) => {
  const { organizations } = getState().firestore.data;
  const { userData, isAdmin: isAdminInStore } = getState().auth;

  // the user is authenticated if user data recieved
  // (even if they're not an admin for a current organization)
  const isAdmin = checkAdminStatus(
    userData?.email || userData?.phoneNumber || "",
    organizations
  );

  // update store only if needed
  if (isAdmin !== isAdminInStore) {
    dispatch({
      type: Action.UpdateAdminStatus,
      payload: isAdmin,
    } as AuthReducerAction<Action.UpdateAdminStatus>);
  }
};
