import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { SubscriptionWhitelist } from "../types";

import { updateSubscription } from "../thunks/subscribe";

import { getFirestoreListeners } from "../selectors";

import { getCollectionPath, getConstraintForColl } from "../utils/utils";

/**
 * A hook used to paginate firestore subecriptions on each date change
 * @TEMP this will probably become unnecessary very soon
 */
const usePaginateFirestore = (): void => {
  const dispatch = useDispatch();
  const calendarDay = useSelector((state: any) => state.app.calendarDay);
  const listeners = useSelector(getFirestoreListeners);

  useEffect(() => {
    Object.keys(listeners).forEach((collection) => {
      const listener = listeners[collection as SubscriptionWhitelist];
      if (listener?.documents || listener?.range) {
        // if constraint is set, extend constraint and update unsubscribe function
        // if no constraint is set, we're already subscribed to all collection entries
        dispatch(
          updateSubscription({
            storeAs: collection,
            collPath: getCollectionPath(
              collection as SubscriptionWhitelist,
              listener.meta
            ),
            constraint: getConstraintForColl(
              collection as SubscriptionWhitelist,
              { ...listener.meta, currentDate: calendarDay }
            ),
            meta: listener.meta,
          })
        );
      }
    });
  }, [calendarDay]);
};

export default usePaginateFirestore;
