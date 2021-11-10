import * as firestore from "@firebase/firestore";

import {
  BookingSubCollection,
  Collection,
  OrgSubCollection,
} from "eisbuk-shared";

import { ORGANIZATION } from "@/config/envInfo";

import { Action, NotifVariant } from "@/enums/store";
import { NotificationMessage } from "@/lib/notifications";

import { bookInterval, cancelBooking } from "../bookingOperations";
import * as appActions from "../appActions";

import {
  secretKey,
  bookingId,
  bookedSlots,
  testBooking,
} from "../__testData__/bookingOperations";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { setupTestBookings } from "../__testUtils__/firestore";
import { deleteAll } from "@/tests/utils";

const db = firestore.getFirestore();
const bookingsCollectionPath = `${Collection.Organizations}/${ORGANIZATION}/${OrgSubCollection.Bookings}`;

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

// mocked return value for `enqueueErrSnackbar`.
// the actual return value is the thunk, but we're using this to easily test dispatching
const errNotifAction = { type: "err_spy" };
jest
  .spyOn(appActions, "showErrSnackbar")
  .mockImplementation(() => errNotifAction as any);

/**
 * A mock function we're passing to `setupTestSlots` and returning as `dispatch`
 */
const mockDispatch = jest.fn();

/**
 * A spy of `getFirebase` function which we're occasionally mocking to throw error
 * for error handling tests
 */
const getFirebaseSpy = jest.spyOn(firestore, "getFirestore");

// we're mocking `t` from `i18next` to be an identity function for easier testing
jest.mock("i18next", () => ({
  t: (label: string) => label,
}));

describe("Booking Notifications", () => {
  afterEach(async () => {
    jest.clearAllMocks();
    await deleteAll([OrgSubCollection.Bookings]);
  });

  describe("'bookInterval'", () => {
    testWithEmulator(
      "should book selected interval on call and enqueue success notification",
      async () => {
        // set up initial state
        const thunkArgs = await setupTestBookings({
          bookedSlots,
          secretKey,
          dispatch: mockDispatch,
        });
        // create a thunk curried with test input values
        const testThunk = bookInterval({
          secretKey,
          slotId: bookingId,
          bookedInterval: testBooking.interval,
          date: testBooking.date,
        });
        // test updating of the db using created thunk and middleware args from stores' setup
        await testThunk(...thunkArgs);
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
            message: NotificationMessage.BookingSuccess,
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
        getFirebaseSpy.mockImplementationOnce(() => {
          throw new Error();
        });
        // run the thunk
        const thunkArgs = await setupTestBookings({
          bookedSlots,
          secretKey,
          dispatch: mockDispatch,
        });
        const testThunk = bookInterval({
          secretKey,
          slotId: bookingId,
          bookedInterval: testBooking.interval,
          date: testBooking.date,
        });
        await testThunk(...thunkArgs);
        expect(mockDispatch).toHaveBeenCalledWith(errNotifAction);
      }
    );
  });

  describe("'cancelBooking'", () => {
    testWithEmulator(
      "should remove selected booking entry and enqueue success notification",
      async () => {
        // set up initial state
        const thunkArgs = await setupTestBookings({
          bookedSlots: { ...bookedSlots, [bookingId]: testBooking },
          secretKey,
          dispatch: mockDispatch,
        });
        // create a thunk curried with test input values
        const testThunk = cancelBooking({
          secretKey,
          slotId: bookingId,
        });
        // test updating of the db using created thunk and middleware args from stores' setup
        await testThunk(...thunkArgs);
        // get all `bookedSlots` for customer
        const bookedSlotsPath = `${bookingsCollectionPath}/${secretKey}/${BookingSubCollection.BookedSlots}`;
        const bookedSlotsRef = firestore.collection(db, bookedSlotsPath);
        const bookedSlotsForCustomer = await firestore.getDocs(bookedSlotsRef);
        // the updated `bookedSlots` should contain 2 default entries (with testBooking removed)
        expect(bookedSlotsForCustomer.docs.length).toEqual(2);
        // check that the success notification has been enqueued
        expect(mockDispatch).toHaveBeenCalledWith(
          appActions.enqueueNotification({
            message: NotificationMessage.BookingCanceled,
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
        getFirebaseSpy.mockImplementationOnce(() => {
          throw new Error();
        });
        // run the thunk
        const thunkArgs = await setupTestBookings({
          bookedSlots,
          secretKey,
          dispatch: mockDispatch,
        });
        const testThunk = cancelBooking({
          secretKey,
          slotId: bookingId,
        });
        await testThunk(...thunkArgs);
        expect(mockDispatch).toHaveBeenCalledWith(errNotifAction);
      }
    );
  });
});
