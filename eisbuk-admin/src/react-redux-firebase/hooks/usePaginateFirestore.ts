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
      if (listener) {
        // if range is set, extend the range and update unsubscribe function
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
