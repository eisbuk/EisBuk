import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { CollectionSubscription } from "@/types/store";

import { updateSubscription } from "../thunks/subscribe";

import { getCalendarDay } from "@/store/selectors/app";
import { getFirestoreListeners } from "../selectors";

import { getCollectionPath, getConstraintForColl } from "../utils";

/**
 * A hook used to paginate firestore subecriptions on each date change
 */
const usePaginateFirestore = (): void => {
  const dispatch = useDispatch();
  const calendarDay = useSelector(getCalendarDay);
  const listeners = useSelector(getFirestoreListeners);

  useEffect(() => {
    Object.keys(listeners).forEach((collection) => {
      const listener = listeners[collection as CollectionSubscription];
      if (listener?.documents || listener?.range) {
        // if constraint is set, extend constraint and update unsubscribe function
        // if no constraint is set, we're already subscribed to all collection entries
        dispatch(
          updateSubscription({
            storeAs: collection,
            collPath: getCollectionPath(collection as CollectionSubscription),
            constraint: getConstraintForColl(
              collection as CollectionSubscription,
              calendarDay
            ),
          })
        );
      }
    });
  }, [calendarDay]);
};

export default usePaginateFirestore;
