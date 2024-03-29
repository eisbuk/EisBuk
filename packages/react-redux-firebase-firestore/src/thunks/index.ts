import { FirestoreThunk, SubscriptionWhitelist } from "../types";

import { updateSubscription, SubscriptionParams } from "./subscribe";
import { updateFirestoreListener, deleteFirestoreListener } from "../actions";

import { getFirestoreListeners } from "../selectors";

/**
 * Sets a listener to active listeners and opens up a subscription to firestore for provided
 * collection. It functions idempotently:
 * - if the listener already exists, just adds the consumer to the list of consumers subscribed to a given listener
 * - if the consumer already registered with particular listener, does nothing
 * @param collection a collection in firestore, whitelisted for subscription, the caller (consumer) wants to subscribe to
 * @param consumerId uuid of a consumer (a calling `useFirestoreSubscribe` hook instance),
 * used to register multiple consumers subscribed to a same listener
 */
export const addFirestoreListener =
  (
    { storeAs, meta, ...subscriptionParams }: Required<SubscriptionParams>,
    consumerId: string
  ): FirestoreThunk =>
  async (dispatch, getState) => {
    const listeners = getFirestoreListeners(getState());
    // check if listener for provided collection exists
    let listener = listeners[storeAs as SubscriptionWhitelist];
    if (listener) {
      // check if current consumer already registered with the listener
      const consumer = listener.consumers.find(
        (consumer) => consumer === consumerId
      );
      if (!consumer) {
        listener.consumers = [...listener.consumers, consumerId];
      }
    } else {
      // if a listener for a collection doesn't exist create a new firestore subscription
      listener = {
        consumers: [consumerId],
        meta,
        // add an empty `unsubscribe` function
        // to prevent possible crashing if called before the
        // actual `unsubscribe` function is updated from the `updateSubscription` thunk
        unsubscribe: () => {},
      };
      dispatch(updateSubscription({ storeAs, meta, ...subscriptionParams }));
    }
    // save updated listener to Redux store
    dispatch(
      updateFirestoreListener(storeAs as SubscriptionWhitelist, listener)
    );
  };

/**
 * Unregisters a consumer from given listener and, if given consumer was the only one registered,
 * runs an `unsubscribe` function and removes the listener from Redux store.
 * @param collection a whitelisted collection in firestore the caller (consumer) wants to unsubscribe from
 * @param consumerId uuid of a consumer (a calling `useFirestoreSubscribe` hook),
 * used to avoid unsubscribing a listener used by consumer other than the one provided.
 */
export const removeFirestoreListener =
  (collection: SubscriptionWhitelist, consumerId: string): FirestoreThunk =>
  async (dispatch, getState) => {
    const {
      firestore: { listeners },
    } = getState();
    // check if listener for provided collection exists
    const listener = listeners[collection];
    if (listener) {
      // remove current consumer from the list of subscribed consumers
      listener.consumers = listener.consumers.filter(
        (consumer) => consumer !== consumerId
      );
      // if this was the last consumer, unsubscribe the listener from firestore
      if (!listener.consumers.length) {
        listener.unsubscribe();
        // remove listener entry and firestore.data entry for a collection
        dispatch(deleteFirestoreListener(collection));
      } else {
        // if this wasn't the last consumer, update the Redux store with the consumer removed
        // from the record
        dispatch(updateFirestoreListener(collection, listener));
      }
    }
  };
