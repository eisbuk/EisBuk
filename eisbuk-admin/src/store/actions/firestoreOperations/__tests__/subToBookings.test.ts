import * as firestore from "@firebase/firestore";

import {
  BookingSubCollection,
  Collection,
  CustomerBase,
  CustomerBookingEntry,
  OrgSubCollection,
} from "eisbuk-shared";

import { ORGANIZATION } from "@/config/envInfo";
import { db } from "@/tests/settings";

import { subscribe } from "../subscriptionHandlers";

import { store } from "@/store/store";

import { testDate, testDateLuxon } from "@/__testData__/date";
import { Routes } from "@/enums/routes";
import { gus, saul } from "@/__testData__/customers";
import { updateLocalColl } from "../actionCreators";
import { LocalStore } from "@/types/store";

const getFirestore = () => db;
jest.spyOn(firestore, "getFirestore").mockImplementation(getFirestore);

const bookingsCollPath = `${Collection.Organizations}/${ORGANIZATION}/${OrgSubCollection.Bookings}`;

// set up secret key to be used throughout the tests
const secretKey = "secret-key";
// set the secret key to the mocked url to be accessible through `window` object
jest.spyOn(window, "window", "get").mockImplementation(
  () =>
    ({
      location: { pathname: `${Routes.CustomerArea}/${secretKey}` },
    } as any)
);

// we're using `onSnapshot` spy to test subscriptions to the firestore db
const onSnapshotSpy = jest.spyOn(firestore, "onSnapshot");

describe("Firestore subscription handlers", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("test subscribing to bookings", () => {
    test("should subscribe for customer's booking doc", () => {
      const bookingDocRef = firestore.doc(
        getFirestore(),
        `${bookingsCollPath}/${secretKey}`
      );

      subscribe({
        coll: OrgSubCollection.Bookings,
        currentDate: testDateLuxon,
        dispatch: store.dispatch,
      });

      expect(onSnapshotSpy.mock.calls[0][0]).toEqual(bookingDocRef);
    });

    test("should subscribe to customer's booked slots for prev, curr and next month", () => {
      const bookedSlotsRef = firestore.collection(
        getFirestore(),
        `${bookingsCollPath}/${secretKey}/${BookingSubCollection.BookedSlots}`
      );
      const [startDate, endDate] = [-1, 2].map((delta) =>
        testDateLuxon.plus({ months: delta }).toISODate()
      );
      const bookingQuery = firestore.query(
        bookedSlotsRef,
        firestore.where("date", ">=", startDate),
        firestore.where("date", "<=", endDate)
      );

      subscribe({
        coll: OrgSubCollection.Bookings,
        currentDate: testDateLuxon,
        dispatch: store.dispatch,
      });

      expect(onSnapshotSpy.mock.calls[1][0]).toEqual(bookingQuery);
    });

    test("should return unsub function which unsubscribes both the bookings doc and bookedSlots listeners", () => {
      // we're passing two mock unsubscribe functions
      const unsubscribeFunctions = Array(2)
        .fill(null)
        .map(() => jest.fn());
      unsubscribeFunctions.forEach((unsubFunc) =>
        onSnapshotSpy.mockImplementationOnce(() => unsubFunc)
      );

      const unsubscribe = subscribe({
        coll: OrgSubCollection.Bookings,
        currentDate: testDateLuxon,
        dispatch: store.dispatch,
      });
      unsubscribe();

      unsubscribeFunctions.forEach((unsubFunc) =>
        expect(unsubFunc).toHaveBeenCalledTimes(1)
      );
    });

    test("should update 'bookings' entry in the local store on snapshot update (and overwrite the existing data completely)", () => {
      /** @TODO replace this with getCustomerBase */
      const initialBookings: CustomerBase = {
        name: saul.name,
        surname: saul.surname,
        id: saul.id,
        category: saul.category,
      };
      store.dispatch(
        updateLocalColl(OrgSubCollection.Bookings, initialBookings)
      );
      const updatedBookings = {
        name: gus.name,
        surname: gus.surname,
        id: gus.id,
        category: gus.category,
      };
      const update = {
        data: () => updatedBookings,
      };

      // we're mocking the implementation only once (first run for the `bookings` update)
      // the rest we're skipping
      onSnapshotSpy.mockImplementation(() => () => {});
      onSnapshotSpy.mockImplementationOnce((_, callback) =>
        // we're calling the update callback immediately to simulate shapshot update
        (callback as any)(update)
      );
      subscribe({
        coll: OrgSubCollection.Bookings,
        currentDate: testDateLuxon,
        dispatch: store.dispatch,
      });

      const updatedState = (store.getState() as LocalStore).firestore.data
        .bookings;
      expect(updatedState).toEqual(updatedBookings);
    });

    test("should update 'bookedSlots' entry in the local store on snapshot update (and overwrite the existing data completely)", () => {
      const initialBookedSlots: Record<string, CustomerBookingEntry> = {
        ["slot-1"]: {
          date: testDate as any,
          interval: "10:00-11:00",
        },
        ["slot-2"]: {
          date: testDate as any,
          interval: "10:00-11:00",
        },
      };
      store.dispatch(
        updateLocalColl(BookingSubCollection.BookedSlots, initialBookedSlots)
      );
      const updatedBookedSlots: Record<string, CustomerBookingEntry> = {
        ["slot-1"]: {
          date: testDate as any,
          interval: "09:00-11:00",
        },
        ["slot-3"]: {
          date: testDate as any,
          interval: "10:00-11:00",
        },
      };
      const update = Object.keys(updatedBookedSlots).reduce(
        (acc, key) => [
          ...acc,
          { id: key, data: () => updatedBookedSlots[key] },
        ],
        [] as any[]
      );

      // we're skipping the execution once as the first call goes out to customer's `bookings` subscription
      onSnapshotSpy.mockImplementationOnce(() => () => {});
      onSnapshotSpy.mockImplementation((_, callback) =>
        // we're calling the update callback immediately to simulate shapshot update
        (callback as any)(update)
      );
      subscribe({
        coll: OrgSubCollection.Bookings,
        currentDate: testDateLuxon,
        dispatch: store.dispatch,
      });

      const updatedState = (store.getState() as LocalStore).firestore.data
        .bookedSlots;
      expect(updatedState).toEqual(updatedBookedSlots);
    });
  });
});
