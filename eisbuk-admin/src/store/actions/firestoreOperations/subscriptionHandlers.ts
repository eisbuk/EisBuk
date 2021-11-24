import {
  Unsubscribe,
  getFirestore,
  collection,
  onSnapshot,
  doc,
  query,
  where,
  DocumentData,
  QuerySnapshot,
} from "@firebase/firestore";
import { DateTime } from "luxon";
import { Dispatch } from "redux";
import { matchPath } from "react-router";

import {
  BookingSubCollection,
  Collection,
  CustomerBase,
  OrganizationMeta,
  OrgSubCollection,
  SlotsByDay,
} from "eisbuk-shared";

import { Routes } from "@/enums/routes";

import { CollectionSubscription, LocalStore } from "@/types/store";

import { updateLocalColl } from "./actionCreators";

import { getOrganization } from "@/lib/getters";

const getOrgPath = () => `organizations/${getOrganization()}`;

interface HandlerParams {
  currentDate: DateTime;
  dispatch: Dispatch;
}

/**
 * A generic for subscription handler:
 * - "handler" (default) - accepts base params
 * - "router" (router function, using `coll` to choose right sub-handler) - extends params with `coll`
 */
interface SubscriptionHandler<
  T extends "router" | "subhandler" = "subhandler"
> {
  (
    params: T extends "router"
      ? HandlerParams & { coll: CollectionSubscription }
      : HandlerParams
  ): Unsubscribe;
}

// #region handlerRouter
/**
 * A router function calls a subscribe handler for a given collection,
 * thus handling subscription for it:
 * - creates a firestore listener with appropriate query params for collection
 * - attaches a callback to `onSnapshot` to properly update local store entry
 *   for collection
 * @param coll
 * @param currentDate
 * @returns
 */
export const subscribe: SubscriptionHandler<"router"> = ({
  coll,
  ...handlerParams
}) => {
  switch (coll) {
    case OrgSubCollection.SlotsByDay:
      return subToSlotsByDay(handlerParams);
    case OrgSubCollection.Bookings:
      return subToBookings(handlerParams);
    case OrgSubCollection.Attendance:
      return subToAttendance(handlerParams);
    case OrgSubCollection.Customers:
      return subToCustomers(handlerParams);
    case Collection.Organizations:
      return subToOrganization(handlerParams);
    default:
      // this should be unreachable with proper usage
      console.error(
        "Trying to subscribe to a non whitelisted function, please investigate the usage"
      );
      // return an empty function not to break the app
      return () => {};
  }
};
// #endregion handlerRouter

// #region subHandlers
/**
 * A subscription handler for `slotsByDay`. Subscribes to each document individually (rather than a collection)
 * since there are only three documents we're interested in (prev, current and next) month, which can't be query restricted,
 * to avoid excess reads.
 * @param currentDate date from which we want to calculate prev, curr and next month
 * @param dispatch redux dispatch function
 * @returns unsubscribe function, created by chaining all three unsubscribe functions received
 * from each individal `onSnapshot` call
 */
const subToSlotsByDay: SubscriptionHandler = ({ currentDate, dispatch }) =>
  [-1, 0, 1].reduce(
    (acc, delta): Unsubscribe => {
      const monthString = currentDate
        .plus({ months: delta })
        .toISODate()
        .substr(0, 7);
      const docRef = doc(
        getFirestore(),
        `${getOrgPath()}/${OrgSubCollection.SlotsByDay}/${monthString}`
      );
      const unsubCurr = onSnapshot(docRef, (snapshot) => {
        const updatedMonth = snapshot.data() as SlotsByDay;
        dispatch(
          updateLocalColl(
            OrgSubCollection.SlotsByDay,
            { [snapshot.id]: updatedMonth },
            true
          )
        );
      });
      return () => {
        acc();
        unsubCurr();
      };
    },
    (() => {}) as Unsubscribe
  );

/**
 * A subscription handler for `bookings`. Subscribes to firestore `bookings` entry for a customer (using `secretKey`),
 * and customer's `bookedSlots` entries restricted to
 * entries for prev, curr and next month of the passed date.
 * @param currentDate date from which we want to calculate prev, curr and next month
 * @param dispatch redux dispatch function
 * @returns unsubscribe function calling functions returned from `onSnapshot` calls for both document and query subscription
 */
export const subToBookings: SubscriptionHandler = ({
  currentDate,
  dispatch,
}) => {
  // we're reading the `secretKey` from the url to keep param interface consistent thoughout the handlers
  // by not adding additional param for `secretKey`, which would cause loads of incompatibilities with TypeScript
  const pathname = window && window.location.pathname;
  const {
    params: { secretKey },
  } = matchPath(pathname, {
    path: `${Routes.CustomerArea}/:secretKey`,
  }) || { params: { secretKey: "" } };

  // create reference for a booking doc
  const customerBookingsPath = `${getOrgPath()}/${
    OrgSubCollection.Bookings
  }/${secretKey}`;
  const docRef = doc(getFirestore(), customerBookingsPath);

  // create query for bookedSlots
  const bookedSlotsRef = collection(
    getFirestore(),
    `${customerBookingsPath}/${BookingSubCollection.BookedSlots}`
  );
  // we're subscribing to prev, curr and next month's `bookedSlots`
  const [startDate, endDate] = [-1, 2].map((delta) =>
    currentDate.plus({ months: delta }).toISODate()
  );
  const bookedSlotsQuery = query(
    bookedSlotsRef,
    where("date", ">=", startDate),
    where("date", "<=", endDate)
  );

  // subscribe to firestore
  const unsubDoc = onSnapshot(docRef, (snapshot) => {
    const updatedEntry = snapshot.data() as CustomerBase;
    dispatch(updateLocalColl(OrgSubCollection.Bookings, updatedEntry));
  });
  const unsubColl = onSnapshot(
    bookedSlotsQuery,
    updateCollSnapshot(BookingSubCollection.BookedSlots, dispatch)
  );

  // we want our unsubscribe function to unsubscribe from both listeners
  return () => {
    unsubDoc();
    unsubColl();
  };
};

/**
 * A subscription handler for `attendance`. Subscribes to firestore `attendance` entry for an organization, restricted to
 * entries for prev, curr and next month of the passed date.
 * @param currentDate date from which we want to calculate prev, curr and next month
 * @param dispatch redux dispatch function
 * @returns unsubscribe function returned from `onSnapshot` call
 */
export const subToAttendance: SubscriptionHandler = ({
  currentDate,
  dispatch,
}) => {
  const collRef = collection(
    getFirestore(),
    `${getOrgPath()}/${OrgSubCollection.Attendance}`
  );
  // we're subscribing to prev, curr and next month's `attendance`
  const [startDate, endDate] = [-1, 2].map((delta) =>
    currentDate.plus({ months: delta }).toISODate()
  );
  const attendanceQuery = query(
    collRef,
    where("date", ">=", startDate),
    where("date", "<=", endDate)
  );

  return onSnapshot(
    attendanceQuery,
    updateCollSnapshot(OrgSubCollection.Attendance, dispatch)
  );
};

/**
 * A subscription handler for `customers`. Subscribes to all `customers` entries for an organization.
 * @param dispatch redux dispatch function
 * @returns unsubscribe function returned from `onSnapshot` call
 */
export const subToCustomers: SubscriptionHandler = ({ dispatch }) => {
  const collRef = collection(
    getFirestore(),
    `${getOrgPath()}/${OrgSubCollection.Customers}`
  );

  return onSnapshot(
    collRef,
    updateCollSnapshot(OrgSubCollection.Customers, dispatch)
  );
};

/**
 * A subscription handler for `organizations`. Subscribes to organization data for a given organization.
 * @param dispatch redux dispatch function
 * @returns unsubscribe function returned from `onSnapshot` call
 */
export const subToOrganization: SubscriptionHandler = ({ dispatch }) => {
  const docRef = doc(getFirestore(), getOrgPath());

  return onSnapshot(docRef, (snapshot) => {
    const update = { [snapshot.id]: snapshot.data() as OrganizationMeta };
    dispatch(updateLocalColl(Collection.Organizations, update, true));
  });
};
// #endregion subHandlers

// #region helpers
/**
 * A higher order function returning `onSnapshot` callback
 * used to iterate through recieved collection snapshot and
 * update local store entry for given collection
 * @param collection
 * @param dispatch
 * @returns
 */
const updateCollSnapshot =
  <C extends CollectionSubscription | BookingSubCollection.BookedSlots>(
    collection: C,
    dispatch: Dispatch
  ) =>
  (snapshot: QuerySnapshot<DocumentData>) => {
    type CollData = Required<LocalStore["firestore"]["data"]>[C];
    type CollEntry = CollData[keyof CollData];

    let updatedData: CollData = {} as CollData;
    snapshot.forEach((doc) => {
      const customerId = doc.id;
      const customer = doc.data() as CollEntry;
      updatedData = { ...updatedData, [customerId]: customer };
    });
    dispatch(updateLocalColl(collection, updatedData));
  };
// #endregion helpers
