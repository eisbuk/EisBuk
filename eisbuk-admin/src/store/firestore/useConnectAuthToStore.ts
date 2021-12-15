import { useEffect } from "react";
import { Store } from "redux";
import { useSyncExternalStore } from "use-sync-external-store/shim";
import { onAuthStateChanged, Auth } from "@firebase/auth";

import { LocalStore } from "@/types/store";

import {
  revalidateAdminStatus,
  updateAuthUser,
} from "@/store/actions/authOperations";
import { isEmpty } from "lodash";

/**
 * A hook used to subscribe to firebase auth state changes and
 * update said changes to the store
 * @param auth firebase.auth instance
 * @param store redux store instance
 */
export default (auth: Auth, store: Store<LocalStore, any>): void => {
  const dispatch = store.dispatch;

  // we're using this (expermantal) hook to mimic
  // react-redux implementation of `useSelector`
  // to subscribe to the store and rerender only when the organization in
  // store changes (as opposed to `store.subscribe` rerendering on each store change)
  const organizations = useSyncExternalStore(
    store.subscribe,
    () => store.getState().firestore.data.organizations
  );

  // revalidate `isAdmin` when the organization changes,
  // as we're using organization data to check if user is admin of given organization
  useEffect(() => {
    if (organizations && !isEmpty(organizations)) {
      dispatch(revalidateAdminStatus);
    }
  }, [organizations]);

  // set listener to user's auth state and update auth in redux
  useEffect(() => {
    onAuthStateChanged(auth, (user) => dispatch(updateAuthUser(user)));
  }, []);
};
