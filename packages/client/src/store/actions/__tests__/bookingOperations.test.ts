/**
 * @jest-environment node
 */

import * as firestore from "@firebase/firestore";
import { collection, doc, getDoc, getDocs } from "@firebase/firestore";

import i18n, { NotificationMessage } from "@eisbuk/translations";

import { getNewStore } from "@/store/createStore";

import { getTestEnv } from "@/__testSetup__/firestore";

import * as getters from "@/lib/getters";

import { NotifVariant } from "@/enums/store";

import {
  bookInterval,
  cancelBooking,
  updateBookingNotes,
} from "../bookingOperations";
import { enqueueNotification } from "@/features/notifications/actions";

import { getBookedSlotDocPath, getBookedSlotsPath } from "@/utils/firestore";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { setupTestBookings, setupTestSlots } from "../__testUtils__/firestore";

import { saul } from "@/__testData__/customers";
import { baseSlot } from "@/__testData__/slots";
import { CustomerBookingEntry } from "@eisbuk/shared";

const getFirestoreSpy = jest.spyOn(firestore, "getFirestore");
const getOrganizationSpy = jest.spyOn(getters, "getOrganization");

const { secretKey } = saul;

// #region testData

/**
 * Intervals available for booking
 */
const intervals = Object.keys(baseSlot.intervals);
/**
 * Existing booked slots in store/firestore
 */
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
 * as corresponging slot needs to exist (in firestore) in order for booking to be allowed
 */
const bookingId = "booked-slot";
/**
 * Test slot compatible with test booking and test customer's (saul) category
 */
const testSlot = {
  ...baseSlot,
  id: bookingId,
  categories: saul.categories,
};

// #endregion testData

describe("Booking Notifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("'bookInterval'", () => {
    testWithEmulator(
      "should book selected interval on call and enqueue success notification",
      async () => {
        // set up initial state
        const store = getNewStore();
        const { db, organization } = await getTestEnv({
          auth: false,
          setup: (db, { organization }) =>
            Promise.all([
              // test slot needs to exist in store in order to be able to book it
              setupTestSlots({
                db,
                store,
                slots: { [bookingId]: testSlot },
                organization,
              }),
              setupTestBookings({
                db,
                store,
                bookedSlots,
                customer: saul,
                organization,
              }),
            ]),
        });
        // make sure tested thunk uses test generated organization
        getOrganizationSpy.mockReturnValue(organization);
        // mock `getFirestore` to return test db
        getFirestoreSpy.mockReturnValue(db as any);
        // create a thunk curried with test input values
        const testThunk = bookInterval({
          secretKey,
          slotId: bookingId,
          bookedInterval: intervals[0],
          date: baseSlot.date,
        });
        const mockDispatch = jest.fn();
        getFirestoreSpy.mockReturnValueOnce(db as any);
        await testThunk(mockDispatch, store.getState);
        // get all `bookedSlots` for customer
        const bookedSlotsForCustomer = await getDocs(
          collection(db, getBookedSlotsPath(organization, secretKey))
        );
        // the updated `bookedSlots` should contain 2 default entries and one new (testBooking)
        expect(bookedSlotsForCustomer.docs.length).toEqual(3);
        // check the updated booking
        const updatedBooking = (
          await getDoc(
            doc(db, getBookedSlotDocPath(organization, secretKey, bookingId))
          )
        ).data();
        expect(updatedBooking).toEqual({
          date: baseSlot.date,
          interval: intervals[0],
        });
        // check that the success notification has been enqueued
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.BookingSuccess),
            variant: NotifVariant.Success,
          })
        );
      }
    );

    // testWithEmulator(
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
          bookedInterval: intervals[0],
          date: baseSlot.date,
        });
        const mockDispatch = jest.fn();
        await testThunk(mockDispatch, () => ({} as any));
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.Error),
            variant: NotifVariant.Error,
          })
        );
      }
    );
  });

  describe("'cancelBooking'", () => {
    testWithEmulator(
      "should remove selected booking entry and enqueue success notification",
      async () => {
        // set up initial state
        const store = getNewStore();
        const { db, organization } = await getTestEnv({
          auth: false,
          setup: (db, { organization }) =>
            // simulate the slot already being booked
            setupTestBookings({
              db,
              store,
              bookedSlots: {
                ...bookedSlots,
                [bookingId]: { date: baseSlot.date, interval: intervals[0] },
              },
              customer: saul,
              organization,
            }),
        });
        const mockDispatch = jest.fn();
        // make sure tested thunk uses test generated organization
        getOrganizationSpy.mockReturnValue(organization);
        // mock `getFirestore` to return test db
        getFirestoreSpy.mockReturnValueOnce(db as any);
        // create a thunk curried with test input values
        const testThunk = cancelBooking({
          secretKey,
          slotId: bookingId,
          organization,
        });
        // test updating of the db using created thunk and middleware args from stores' setup
        await testThunk(mockDispatch, store.getState);
        // get all `bookedSlots` for customer
        const bookedSlotsForCustomer = await getDocs(
          collection(db, getBookedSlotsPath(organization, secretKey))
        );
        // the updated `bookedSlots` should contain 2 default entries (with testBooking removed)
        expect(bookedSlotsForCustomer.docs.length).toEqual(2);
        // check that the success notification has been enqueued
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.BookingCanceled),
            variant: NotifVariant.Success,
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
        const mockDispatch = jest.fn();
        await testThunk(mockDispatch, () => ({} as any));
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.Error),
            variant: NotifVariant.Error,
          })
        );
      }
    );
  });

  describe("'updateBookingNote'", () => {
    testWithEmulator(
      "should update the 'bookingNote' on a booking and enqueue success notification",
      async () => {
        const dummyBooking: CustomerBookingEntry = {
          date: testSlot.date,
          interval: Object.keys(testSlot.intervals)[0],
        };
        const bookingNotes = "Colourless green ideas sleep furiously";
        // set up initial state
        const store = getNewStore();
        const { db, organization } = await getTestEnv({
          auth: false,
          setup: (db, { organization }) =>
            Promise.all([
              setupTestSlots({
                db,
                store,
                slots: { [testSlot.id]: testSlot },
                organization,
              }),
              setupTestBookings({
                db,
                organization,
                store,
                bookedSlots: { [testSlot.id]: dummyBooking },
                customer: saul,
              }),
            ]),
        });
        const mockDispatch = jest.fn();
        // make sure tested thunk uses test generated organization
        getOrganizationSpy.mockReturnValue(organization);
        // mock `getFirestore` to return test db
        getFirestoreSpy.mockReturnValueOnce(db as any);
        // create a thunk curried with test input values
        const testThunk = updateBookingNotes({
          secretKey,
          slotId: testSlot.id,
          bookingNotes,
        });
        // test updating of the db using created thunk and middleware args from stores' setup
        await testThunk(mockDispatch, store.getState);
        // Check updates
        const updatedBooking = await getDoc(
          doc(
            db,
            getBookedSlotDocPath(organization, saul.secretKey, testSlot.id)
          )
        );
        // the updated booking should contain the same data with 'bookingNotes' added
        expect(updatedBooking.data()).toEqual({
          ...dummyBooking,
          bookingNotes,
        });
        // check that the success notification has been enqueued
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.BookingNotesUpdated),
            variant: NotifVariant.Success,
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
        const testThunk = updateBookingNotes({
          secretKey,
          slotId: bookingId,
          bookingNotes: "",
        });
        const mockDispatch = jest.fn();
        await testThunk(mockDispatch, () => ({} as any));
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.BookingNotesError),
            variant: NotifVariant.Error,
          })
        );
      }
    );
  });
});
