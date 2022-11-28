import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo, useRef } from "react";
import { v4 as uuid } from "uuid";

import { CollectionSubscription } from "../types";

import { addFirestoreListener, removeFirestoreListener } from "../thunks";

import { getCollectionPath, getConstraintForColl } from "../utils/utils";
import { DateTime } from "luxon";

/**
 * A hook used to create, update and remove firestore subscriptions and update the
 * `listeners` entries accordingly
 * @param collections a list of collections we're creating subscriptions for
 */
const useFirestoreSubscribe = (
  organization: string,
  subscriptions: CollectionSubscription[]
): void => {
  const dispatch = useDispatch();
  const currentDate = useSelector(
    (state: any) => state.app.calendarDay as DateTime
  );

  /**
   * A uuid used to identify the current instance of a hook as a consumer of registered listeners.
   */
  const consumerId = useMemo(() => uuid(), []);

  /**
   * We're using `oldCollections` ref to differentiate collections needing to be set/unset with each new update.
   */
  const oldSubscriptions = useRef<CollectionSubscription[]>([]);
  /**
   * We're using `newCollections` ref in order to be able to access new values
   * from already created `useEffect` cleanup function (and thus escape closure constraints):
   * - mutable ref object stores an adress for a mutable value
   * - we update the ref object with the new value
   * - the cleanup function of `useEffect` (already created on prevoius render) has this mutable object's adress
   * copied in closure, but this way it's able to acces the new (current) value on function run
   */
  const newSubscriptions = useRef<CollectionSubscription[]>([]);

  // on each rerender, the current value for collections gets saved to `newCollections` ref
  newSubscriptions.current = subscriptions;

  useEffect(() => {
    // perform `setCollection` on each new collection (present in new state, but not in the old one)
    newSubscriptions.current.forEach((subscription) => {
      if (
        !oldSubscriptions.current.find(
          ({ collection }) => subscription.collection === collection
        )
      ) {
        const meta = { organization, currentDate, ...subscription.meta };

        dispatch(
          addFirestoreListener(
            {
              storeAs: subscription.collection,
              collPath: getCollectionPath(subscription.collection, meta),
              constraint: getConstraintForColl(subscription.collection, meta),
              meta,
            },
            consumerId
          )
        );
      }
    });

    // save updated collections for future reference
    oldSubscriptions.current = subscriptions;

    return () => {
      // unset collections present in old state, but not in the updated one
      oldSubscriptions.current.forEach((subscription) => {
        if (
          !newSubscriptions.current.find(
            ({ collection }) => subscription.collection === collection
          )
        ) {
          dispatch(
            removeFirestoreListener(subscription.collection, consumerId)
          );
        }
      });
    };
  }, [subscriptions]);

  useEffect(() => {
    return () => {
      // we're unsetting the firestore listener with timeout to allow for
      // other consumers (instances of this hook) to update subscriptions
      // and prevent unsubscribing from the listener's which might be reused by the
      // next rendered component/view
      setTimeout(() => {
        oldSubscriptions.current.forEach((subscription) => {
          dispatch(
            removeFirestoreListener(subscription.collection, consumerId)
          );
        });
      }, 50);
    };
  }, []);
};

export default useFirestoreSubscribe;
