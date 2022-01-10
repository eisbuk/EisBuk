import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { collection } from "@firebase/firestore";

import { Collection } from "eisbuk-shared";

import {
  updateFirestoreListener,
  updateLocalColl,
} from "../actions/actionCreators";

import { getCalendarDay } from "@/store/selectors/app";

import { getFirestoreListeners } from "../selectors";
import { CollectionSubscription, FirestoreThunk } from "@/types/store";
import {
  doc,
  getFirestore,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { __organization__ } from "@/lib/constants";
import { updateCollSnapshot } from "../actions/subscriptionHandlers";

/**
 * A hook used to paginate firestore subecriptions on each date change
 */
const usePaginateFirestore = (): void => {
  const dispatch = useDispatch();
  const calendarDay = useSelector(getCalendarDay);
  const listeners = useSelector(getFirestoreListeners);

  const startDate = calendarDay.minus({ months: 1 }).startOf("month");
  const endDate = calendarDay.plus({ months: 1 }).endOf("month");

  // range for "date" based queries
  const startDateISO = startDate.toISODate();
  const endDateISO = endDate.toISODate();

  const numMonthsToSubscribe = Math.round(
    endDate.diff(startDate, "months").months
  );

  // month strings for document id based queries
  const monthsToSubscribe = Array(numMonthsToSubscribe)
    .fill(null)
    .map((_, i) => startDate.plus({ months: i }).toISODate().substring(0, 7));

  useEffect(() => {
    Object.keys(listeners).forEach((collection) => {
      const listener = listeners[collection as CollectionSubscription];
      if (listener) {
        // if range is set, extend the range and update unsubscribe function
        if (listener.range) {
          dispatch(
            extendSubscriptionRange(
              collection as CollectionSubscription,
              startDateISO,
              endDateISO
            )
          );
        } else if (listener.documents) {
          dispatch(
            extendDocumentSubscriptions(
              collection as CollectionSubscription,
              monthsToSubscribe
            )
          );
        }
      }
    });
  }, [calendarDay]);
};

const extendSubscriptionRange =
  (
    coll: CollectionSubscription,
    newStart: string,
    newEnd: string
  ): FirestoreThunk =>
  async (dispatch, getState) => {
    const listener = getFirestoreListeners(getState())[coll];
    // exit early if no range found, should not happen in production
    if (!listener?.range) return;

    const collRef = collection(
      getFirestore(),
      Collection.Organizations,
      __organization__,
      coll
    );

    const unsubscribeFunctions = [];

    let [rangeProperty, rangeStart, rangeEnd] = listener.range;

    if (newStart < rangeStart) {
      // extend subscribed range from lower side
      const newQuery = query(
        collRef,
        where(rangeProperty, ">=", newStart),
        where(rangeProperty, "<", rangeStart)
      );
      // update range start with new value for future resubscriptions
      rangeStart = newStart;
      // subscribe to additional entries and update unsubscribe function
      const unsub = onSnapshot(newQuery, updateCollSnapshot(coll, dispatch));
      unsubscribeFunctions.push(unsub);
    }
    if (newEnd > rangeEnd) {
      // extend subscribed range from lower side
      const newQuery = query(
        collRef,
        where(rangeProperty, ">", rangeEnd),
        where(rangeProperty, "<=", newEnd)
      );
      // update range start with new value for future resubscriptions
      rangeEnd = newEnd;

      // subscribe to additional entries and update unsubscribe function
      const unsub = onSnapshot(newQuery, updateCollSnapshot(coll, dispatch));
      unsubscribeFunctions.push(unsub);
    }

    // create a new `unsubscribe` function for the entire listener
    const unsubscribe = unsubscribeFunctions.reduce(
      (acc, curr) => () => {
        acc();
        curr();
      },
      // initialize with old `unsubscribe` as we're updating an existing function
      // only to include the new `unsubscribe` handlers
      listener.unsubscribe
    );

    dispatch(
      updateFirestoreListener(coll, {
        ...listener,
        unsubscribe,
        range: [rangeProperty, rangeStart, rangeEnd],
      })
    );
  };

const extendDocumentSubscriptions =
  (coll: CollectionSubscription, newDocs: string[]): FirestoreThunk =>
  async (dispatch, getState) => {
    const listener = getFirestoreListeners(getState())[coll];

    // exit early if no docs found, should not happen in production
    if (!listener?.documents) return;

    // add subscription only to new docs (the ones not subscribed to yet)
    const docsDiff = newDocs.filter(
      (month) => !listener.documents?.includes(month)
    );

    // extend an existing `unsubscribe` function by subscribing to additional docs
    // and composing the existing `unsubscribe` function with each newly created unsub function
    const unsubscribe = docsDiff.reduce((acc, docId) => {
      const docRef = doc(
        getFirestore(),
        Collection.Organizations,
        __organization__,
        coll,
        docId
      );

      const unsubDoc = onSnapshot(docRef, (docSnapshot) => {
        const docData = docSnapshot.data();
        dispatch(updateLocalColl(coll, { [docId]: docData as any }, true));
      });

      return () => {
        acc();
        unsubDoc();
      };
    }, listener.unsubscribe);

    // update listener with extended docs list and new `unsubscribe` function
    dispatch(
      updateFirestoreListener(coll, {
        ...listener,
        unsubscribe,
        documents: [...docsDiff, ...listener.documents].sort((a, b) =>
          a > b ? 1 : -1
        ),
      })
    );
  };

export default usePaginateFirestore;
