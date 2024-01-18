import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { CollectionSubscription } from "../types";

import { getFirestoreListeners } from "../selectors";

import { updateSubscription } from "../thunks/subscribe";

import { getCollectionPath, getConstraintForColl } from "../utils/utils";

const useUpdateSubscription = (
  subscription: CollectionSubscription,
  deps: any[]
): void => {
  const dispatch = useDispatch();
  const collection = subscription.collection;

  const listeners = useSelector(getFirestoreListeners);

  useEffect(() => {
    const listener = listeners[collection];

    if (!subscription.meta || !listener) return;

    const meta = { ...listener.meta, ...subscription.meta };

    dispatch(
      updateSubscription({
        storeAs: collection,
        collPath: getCollectionPath(subscription.collection, meta),
        constraint: getConstraintForColl(subscription.collection, meta),
        meta,
      })
    );
  }, deps);
};

export default useUpdateSubscription;
