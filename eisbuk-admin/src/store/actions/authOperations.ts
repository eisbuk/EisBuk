import i18n from "i18next";

import { ORGANIZATION, functionsZone } from "@/config/envInfo";

import { NotifVariant, Action } from "@/enums/store";

import { AuthReducerAction, FirestoreThunk } from "@/types/store";

import {
  enqueueNotification,
  showErrSnackbar,
} from "@/store/actions/appActions";

const updateAdminStatus = (
  uid: string,
  amIAdmin: boolean
): AuthReducerAction<Action.IsAdminReceived> => ({
  type: Action.IsAdminReceived,
  payload: { uid, amIAdmin },
});

/**
 * Creates firestore async thunk:
 * - dispatches signout request to firestore
 * - enqueues success/error snackbar depending on the outcome of firestore operation
 * @returns async thunk
 */
export const signOut = (): FirestoreThunk => async (
  dispatch,
  getState,
  { getFirebase }
) => {
  const firebase = getFirebase();
  try {
    await firebase.auth().signOut();

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
export const queryUserAdminStatus = (): FirestoreThunk => async (
  dispatch,
  getState,
  { getFirebase }
) => {
  try {
    const firebase = getFirebase();

    const res = (await firebase
      .app()
      .functions(functionsZone)
      .httpsCallable("amIAdmin")({
      organization: ORGANIZATION,
    })) as { data: { amIAdmin: boolean } };

    const { amIAdmin } = res.data;
    const { uid } = getState().firebase.auth;

    if (uid) {
      dispatch(updateAdminStatus(uid, amIAdmin));
    }
  } catch (err) {
    showErrSnackbar();
  }
};
