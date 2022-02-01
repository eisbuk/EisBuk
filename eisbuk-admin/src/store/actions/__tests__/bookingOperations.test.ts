import * as firestore from "@firebase/firestore";
import i18n from "@/__testUtils__/i18n";

import {
  BookingSubCollection,
  Collection,
  OrgSubCollection,
} from "eisbuk-shared";

import { getNewStore } from "@/store/createStore";

import { __organization__ } from "@/lib/constants";

import { getTestEnv } from "@/__testSetup__/getTestEnv";

import { Action, NotifVariant } from "@/enums/store";
import { NotificationMessage } from "@/enums/translations";

import { bookInterval, cancelBooking } from "../bookingOperations";
import * as appActions from "../appActions";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { deleteAll } from "@/__testUtils__/firestore";
import {
  setupTestBookings,
  setupTestSlotsTemp as setupTestSlots,
} from "../__testUtils__/firestore";

import { saul } from "@/__testData__/customers";
import { baseSlot } from "@/__testData__/slots";

const bookingsCollectionPath = `${Collection.Organizations}/${__organization__}/${OrgSubCollection.Bookings}`;

/**
 * Mock `enqueueSnackbar` implementation for easier testing.
 * Here we're using the same implmentation as the original function (action creator),
 * only omitting the notification key (as this is simpler)
 */
const mockEnqueueSnackbar = ({
  // we're omitting the key as it is, in most cases, signed with date and random number
  // and this is easier than mocking `Date` object to always return the same value
  // and seeding random to given value
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  key,
  ...notification
}: Parameters<typeof appActions.enqueueNotification>[0]) => ({
  type: Action.EnqueueNotification,
  payload: { ...notification },
});

// mock `enqueueSnackbar` in component
jest
  .spyOn(appActions, "enqueueNotification")
  .mockImplementation(mockEnqueueSnackbar as any);

/**
 * A mock function we're passing to `setupTestSlots` and returning as `dispatch`
 */
const mockDispatch = jest.fn();

/**
 * A spy of `getFirebase` function which we're using to make sure
 * all firestore calls get dispatched against test `db`
 */
const getFirestoreSpy = jest.spyOn(firestore, "getFirestore");

const { secretKey } = saul;

// #region testData
/** Intervals available for booking */
const intervals = Object.keys(baseSlot.intervals);
/** Existing booked slots in store/firestore */
const bookedSlots = {
  ["test-slot-1"]: {
    date: baseSlot.date,
    interval: intervals[0],
  },
  ["test-slot-2"]: {
    date: baseSlot.date,
    interval: intervals[0],
  },
};
/**
 * Id used for test booking and corresponding slot,
 * as curresponging slot needs to exist in order for booking to be allowed
 */
const bookingId = "booked-slot";
const testBooking = {
  date: baseSlot.date,
  interval: intervals[0],
};
/** Test slot compatible with test booking and test customer's (saul) category */
const testSlot = {
  ...baseSlot,
  id: bookingId,
  categories: [saul.category],
};
// #endregion testData

describe("Booking Notifications", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await deleteAll();
  });

  describe("'bookInterval'", () => {
    testWithEmulator(
      "should book selected interval on call and enqueue success notification",
      async () => {
        // set up initial state
        const store = getNewStore();
        const db = await getTestEnv({
          auth: false,
          setup: (db) =>
            Promise.all([
              // test slot needs to exist in store in order to be able to book it
              setupTestSlots({ db, store, slots: { [bookingId]: testSlot } }),
              setupTestBookings({ db, store, bookedSlots, customer: saul }),
            ]),
        });
        // mock `getFirestore` to return test db
        getFirestoreSpy.mockReturnValueOnce(db as any);
        // create a thunk curried with test input values
        const testThunk = bookInterval({
          secretKey,
          slotId: bookingId,
          bookedInterval: testBooking.interval,
          date: testBooking.date,
        });
        await testThunk(mockDispatch, store.getState);
        // get all `bookedSlots` for customer
        const bookedSlotsPath = `${bookingsCollectionPath}/${secretKey}/${BookingSubCollection.BookedSlots}`;
        const bookedSlotsRef = firestore.collection(db, bookedSlotsPath);
        const bookedSlotsForCustomer = await firestore.getDocs(bookedSlotsRef);
        // the updated `bookedSlots` should contain 2 default entries and one new (testBooking)
        expect(bookedSlotsForCustomer.docs.length).toEqual(3);
        // check the updated booking
        const updatedBookingRef = firestore.doc(db, bookedSlotsPath, bookingId);
        const updatedBooking = (
          await firestore.getDoc(updatedBookingRef)
        ).data();
        expect(updatedBooking).toEqual(testBooking);
        // check that the success notification has been enqueued
        expect(mockDispatch).toHaveBeenCalledWith(
          appActions.enqueueNotification({
            message: i18n.t(NotificationMessage.BookingSuccess),
            closeButton: true,
            options: {
              variant: NotifVariant.Success,
            },
          })
        );
      }
    );

    testWithEmulator(
      "should enqueue error notification if operation failed",
      async () => {
        // intentionally cause error in the execution
        getFirestoreSpy.mockImplementationOnce(() => {
          throw new Error();
        });
        // run the thunk
        const testThunk = bookInterval({
          secretKey,
          slotId: bookingId,
          bookedInterval: testBooking.interval,
          date: testBooking.date,
        });
        await testThunk(mockDispatch, () => ({} as any));
        expect(mockDispatch).toHaveBeenCalledWith(appActions.showErrSnackbar);
      }
    );
  });

  describe("'cancelBooking'", () => {
    testWithEmulator(
      "should remove selected booking entry and enqueue success notification",
      async () => {
        // set up initial state
        const store = getNewStore();
        const db = await getTestEnv({
          auth: false,
          setup: (db) =>
            // simulate the slot already being booked
            setupTestBookings({
              db,
              store,
              bookedSlots: { ...bookedSlots, [bookingId]: testBooking },
              customer: saul,
            }),
        });
        // mock `getFirestore` to return test db
        getFirestoreSpy.mockReturnValueOnce(db as any);
        // create a thunk curried with test input values
        const testThunk = cancelBooking({
          secretKey,
          slotId: bookingId,
        });
        // test updating of the db using created thunk and middleware args from stores' setup
        await testThunk(mockDispatch, store.getState);
        // get all `bookedSlots` for customer
        const bookedSlotsPath = `${bookingsCollectionPath}/${secretKey}/${BookingSubCollection.BookedSlots}`;
        const bookedSlotsRef = firestore.collection(db, bookedSlotsPath);
        const bookedSlotsForCustomer = await firestore.getDocs(bookedSlotsRef);
        // the updated `bookedSlots` should contain 2 default entries (with testBooking removed)
        expect(bookedSlotsForCustomer.docs.length).toEqual(2);
        // check that the success notification has been enqueued
        expect(mockDispatch).toHaveBeenCalledWith(
          appActions.enqueueNotification({
            message: i18n.t(NotificationMessage.BookingCanceled),
            closeButton: true,
            options: {
              variant: NotifVariant.Success,
            },
          })
        );
      }
    );

    testWithEmulator(
      "should enqueue error notification if operation failed",
      async () => {
        // intentionally cause an error
        getFirestoreSpy.mockImplementationOnce(() => {
          throw new Error();
        });
        // run the thunk
        const testThunk = cancelBooking({
          secretKey,
          slotId: bookingId,
        });
        await testThunk(mockDispatch, () => ({} as any));
        expect(mockDispatch).toHaveBeenCalledWith(appActions.showErrSnackbar);
      }
    );
  });
});
