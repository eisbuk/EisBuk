import React, { useRef } from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import {
  Provider as ReduxProvider,
  ProviderProps,
  useSelector,
} from "react-redux";
import { DateTime } from "luxon";

import { Collection, OrgSubCollection } from "eisbuk-shared";

import { ORGANIZATION } from "@/config/envInfo";

import { ReduxFirestoreContext } from "./ReduxFiresotreContext";

import { getCalendarDay } from "../selectors/app";

import { luxon2ISODate } from "@/utils/date";

/**
 * `activeListeners` entry for each registered listener.
 */
interface Listener {
  /**
   * List of ids of subscribed hooks.
   * Used to check if more than one hook is subscribed to the
   * same firestore listener when running `unsetListener` function.
   */
  consumers: string[];
  /**
   * Unsubscribe function returned from `onSnapshot` firestore subscription function.
   * Used to cancel firestore listener.
   */
  unsubscribe: () => void;
}

/**
 * Currently registered listeners
 */
interface ActiveListeners {
  [index: string]: Listener | undefined;
}

/**
 * A wrapper around redux store provider
 * - renders `react-redux` `Provider` component, and passes all of the props down to it
 * - uses `store` prop to add extra layer subscribing to `firestore` and dispatching real-time
 * data updates to redux store
 *
 * _no need to render `react-redux` `Provider` if using this component (as it is already provided within the returned JSX)_
 */
const ReduxFirestoreProvider: React.FC<ProviderProps> = ({
  children,
  ...props
}) => {
  /**
   * A current date (of selection) received from redux store,
   * used to add query constraints
   */
  const currentDate = useSelector(getCalendarDay);
  // const { store } = props;

  /**
   * We're using this ref to keep track of active listeners, their consumers and unsubscribe functions.
   */
  const activeListeners = useRef<ActiveListeners>({});

  /**
   * Sets a listener to active listeners and opens up a subscription to firestore for provided
   * collection. It functions idempotently:
   * - if the listener already exists, just adds the consumer to the list of consumers subscribed to a given listener
   * - if the consumer already registered with particular listener, does nothing
   * @param collection a whitelisted collection in firestore the caller (consumer) wants to subscribe to
   * @param consumerId uuid of a consumer (a calling `useFirestoreSubscribe` hook instance),
   * used to register multiple consumers subscribed to a same listener
   */
  const setListener = (collection: OrgSubCollection, consumerId: string) => {
    // check if listener for provided collection exists
    const listener = activeListeners.current[collection];
    if (listener) {
      // check if current consumer already regietered with the listener
      const consumer = listener.consumers.find(
        (consumer) => consumer === consumerId
      );
      if (!consumer) listener.consumers.push(consumerId);
    } else {
      // if a listener for a collection doesn't exist create a new firestore subscription
      activeListeners.current[collection] = {
        consumers: [consumerId],
        unsubscribe: subscribe(collection, currentDate),
      };
    }
  };

  /**
   * Unregisters a consumer from given listener and, if given consumer was the only one registered,
   * runs an `unsubscribe` function and removes a listener from `activeListeners` record.
   * @param collection a whitelisted collection in firestore the caller (consumer) wants to unsubscribe from
   * @param consumerId uuid of a consumer (a calling `useFirestoreSubscribe` hook),
   * used to avoid unsubscribing a listener used by consumer other than the one provided
   */
  const unsetListener = (collection: OrgSubCollection, consumerId: string) => {
    // check if listener for provided collection exists
    const listener = activeListeners.current[collection];
    if (listener) {
      // remove current consumer from the list of subscribed consumers
      listener.consumers = listener.consumers.filter(
        (consumer) => consumer === consumerId
      );
      if (!listener.consumers) {
        // if this was the last consumer, unsubscribe the listener from firestore
        listener.unsubscribe();
        // delete listener entry
        delete activeListeners.current[collection];
      }
    }
  };

  return (
    <ReduxFirestoreContext.Provider
      value={{
        setListener,
        unsetListener,
      }}
    >
      <ReduxProvider {...props}>{children}</ReduxProvider>
    </ReduxFirestoreContext.Provider>
  );
};

const subscribe = (coll: OrgSubCollection, currentDate: DateTime) => {
  const orgPath = `${Collection.Organizations}/${ORGANIZATION}`;
  const db = getFirestore();
  const collectionRef = collection(db, `${orgPath}/${coll}`);
  const [startDate, endDate] = [-1, 2].map((delta) => {
    const luxonDate = currentDate.plus({ months: delta });
    return luxon2ISODate(luxonDate);
  });
  // crate a query
  const q = query(
    collectionRef,
    where("date", ">", startDate),
    where("date", "<", endDate)
  );
  // return a subsription result (an unsubscribe function)
  return onSnapshot(q, (querySnapshot) => {
    querySnapshot.forEach((document) => {
      const docId = document.id;
      const docData = document.data();
      /** @TEMP add store dispatch here */
      console.log({ [docId]: docData });
    });
  });
};

export default ReduxFirestoreProvider;
