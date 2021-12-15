import { useDispatch } from "react-redux";
import { useEffect, useMemo, useRef } from "react";
import { v4 as uuid } from "uuid";

import { CollectionSubscription } from "@/types/store";

import {
  addFirestoreListener,
  removeFirestoreListener,
} from "@/store/actions/firestoreOperations";

/**
 * A hook used to communicate with `ReduxFirestoreProvider`.
 * Adds listeners to `ReduxFirestoreProvider` (and removes them on unmount).
 * @param collections a list of (whitelisted) collections we're adding listeners for
 */
const useFirestoreSubscribe = (collections: CollectionSubscription[]): void => {
  const dispatch = useDispatch();

  /**
   * A uuid used to identify the current instance of a hook as a consumer of registered listeners.
   */
  const consumerId = useMemo(() => uuid(), []);

  /**
   * We're using `oldCollections` ref to differentiate collections needing to be set/unset with each new update.
   */
  const oldCollections = useRef<CollectionSubscription[]>([]);
  /**
   * We're using `newCollections` ref in order to be able to access new values
   * from already created `useEffect` cleanup function (and thus escape closure constraints):
   * - mutable ref object stores an adress for a mutable value
   * - we update the ref object with the new value
   * - the cleanup function of `useEffect` (already created on prevoius render) has this mutable object's adress
   * copied in closure, but this way it's able to acces the new (current) value on function run
   */
  const newCollections = useRef<CollectionSubscription[]>([]);
  // on each rerender, the current value for collections gets saved to `newCollections` ref
  newCollections.current = collections;

  useEffect(() => {
    // perform `setCollection` on each new collection (present in new state, but not in the old one)
    newCollections.current.forEach((coll) => {
      if (!oldCollections.current.includes(coll)) {
        dispatch(addFirestoreListener(coll, consumerId));
      }
    });

    // save updated collections for future reference
    oldCollections.current = collections;

    return () => {
      // unset collections present in old state, but not in the updated one
      oldCollections.current.forEach((coll) => {
        if (!newCollections.current.includes(coll)) {
          dispatch(removeFirestoreListener(coll, consumerId));
        }
      });
    };
  }, [collections]);

  useEffect(() => {
    return () => {
      // we're unsetting the firestore listener with timeout to allow for
      // other consumers (instances of this hook) to update subscriptions
      // and prevent unsubscribing from the listener's which might be reused by the
      // next rendered component/view
      setTimeout(() => {
        oldCollections.current.forEach((coll) => {
          dispatch(removeFirestoreListener(coll, consumerId));
        });
      }, 50);
    };
  }, []);
};

export default useFirestoreSubscribe;
