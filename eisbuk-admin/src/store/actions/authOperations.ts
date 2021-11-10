import { getFirestore, doc, getDoc } from "@firebase/firestore";
import { getAuth } from "@firebase/auth";
import i18n from "i18next";

import { ORGANIZATION } from "@/config/envInfo";

import { NotifVariant, Action } from "@/enums/store";

import { AuthReducerAction, FirestoreThunk } from "@/types/store";

import {
  enqueueNotification,
  showErrSnackbar,
} from "@/store/actions/appActions";
import { Collection } from "eisbuk-shared/dist";

const updateOrganizationStatus = (
  uid: string,
  admins: string[]
): AuthReducerAction<Action.IsOrganizationStatusReceived> => ({
  type: Action.IsOrganizationStatusReceived,
  payload: { uid, admins },
});

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
export const queryOrganizationStatus = (): FirestoreThunk => async (
  dispatch,
  getState
) => {
  try {
    const db = getFirestore();

    const orgRef = doc(db, `${Collection.Organizations}/${ORGANIZATION}`);
    const res = await getDoc(orgRef);
    const admins: string[] = res.data()?.admins ?? [];
    const { uid } = (getState() as any).firebase.auth; /** @TODO_AUTH */

    if (uid) {
      dispatch(updateOrganizationStatus(uid, admins));
    }
  } catch (err) {
    // TODO: inform the user that the login was successful, but
    // the don't have permission to access
    dispatch(showErrSnackbar());
  }
};
