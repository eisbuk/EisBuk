/**
 * @vitest-environment node
 */

import { describe, vi, expect, beforeEach } from "vitest";
import * as functions from "@firebase/functions";
import { DateTime } from "luxon";

import i18n, { NotificationMessage } from "@eisbuk/translations";
import {
  Collection,
  CustomerBookingEntry,
  sanitizeCustomer,
} from "@eisbuk/shared";

import { saul } from "@eisbuk/testing/customers";
import { baseSlot } from "@eisbuk/testing/slots";

import { getNewStore } from "@/store/createStore";

import { getTestEnv } from "@/__testSetup__/firestore";

import * as getters from "@/lib/getters";

import { NotifVariant } from "@/enums/store";

import {
  bookInterval,
  cancelBooking,
  updateBookingNotes,
  customerSelfUpdate,
  customerSelfRegister,
} from "../bookingOperations";
import { enqueueNotification } from "@/features/notifications/actions";

import {
  getBookedSlotDocPath,
  getBookedSlotsPath,
  getBookingsDocPath,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "@/utils/firestore";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import {
  setupTestBookings,
  setupTestCustomer,
  setupTestSlots,
} from "../__testUtils__/firestore";

import { waitFor } from "@/__testUtils__/helpers";

const getOrganizationSpy = vi.spyOn(getters, "getOrganization");

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

/**
 * In some cases, we don't need an additional 'getFirestore' thunk argument, so we're passing this as a placeholder for type safety
 */
const dummyGetFirestore = () => ({} as any);

describe("Booking operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
        // create a thunk curried with test input values
        const testThunk = bookInterval({
          secretKey,
          slotId: bookingId,
          interval: intervals[0],
          date: baseSlot.date,
        });
        const mockDispatch = vi.fn();
        // mock `getFirestore` to return test db
        const getFirestore = () => db as any;
        await testThunk(mockDispatch, store.getState, { getFirestore });
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
            message: i18n.t(NotificationMessage.BookingSuccess, {
              date: DateTime.fromISO(baseSlot.date),
              interval: intervals[0],
            }),
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
        const testError = new Error("test");
        const getFirestore = () => {
          throw testError;
        };
        // run the thunk
        const testThunk = bookInterval({
          secretKey,
          slotId: bookingId,
          interval: intervals[0],
          date: baseSlot.date,
        });
        const mockDispatch = vi.fn();
        await testThunk(mockDispatch, () => ({} as any), { getFirestore });
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.BookingError, {
              date: DateTime.fromISO(baseSlot.date),
              interval: intervals[0],
            }),
            variant: NotifVariant.Error,
            error: testError,
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
        const mockDispatch = vi.fn();
        // make sure tested thunk uses test generated organization
        getOrganizationSpy.mockReturnValue(organization);
        // mock `getFirestore` to return test db
        const getFirestore = () => db as any;
        // create a thunk curried with test input values
        const testThunk = cancelBooking({
          secretKey,
          slotId: bookingId,
          organization,
          interval: intervals[0],
          date: baseSlot.date,
        });
        // test updating of the db using created thunk and middleware args from stores' setup
        await testThunk(mockDispatch, store.getState, { getFirestore });
        // get all `bookedSlots` for customer
        const bookedSlotsForCustomer = await getDocs(
          collection(db, getBookedSlotsPath(organization, secretKey))
        );
        // the updated `bookedSlots` should contain 2 default entries (with testBooking removed)
        expect(bookedSlotsForCustomer.docs.length).toEqual(2);
        // check that the success notification has been enqueued
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.BookingCanceled, {
              date: DateTime.fromISO(baseSlot.date),
              interval: intervals[0],
            }),
            variant: NotifVariant.Success,
          })
        );
      }
    );

    testWithEmulator(
      "should enqueue error notification if operation failed",
      async () => {
        // intentionally cause an error
        const testError = new Error("test");
        const getFirestore = () => {
          throw testError;
        };
        // run the thunk
        const testThunk = cancelBooking({
          secretKey,
          slotId: bookingId,
          interval: intervals[0],
          date: baseSlot.date,
        });
        const mockDispatch = vi.fn();
        await testThunk(mockDispatch, () => ({} as any), { getFirestore });
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.BookingCanceledError, {
              date: DateTime.fromISO(baseSlot.date),
              interval: intervals[0],
            }),
            variant: NotifVariant.Error,
            error: testError,
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
        const mockDispatch = vi.fn();
        // make sure tested thunk uses test generated organization
        getOrganizationSpy.mockReturnValue(organization);
        // mock `getFirestore` to return test db
        const getFirestore = () => db as any;
        // create a thunk curried with test input values
        const testThunk = updateBookingNotes({
          secretKey,
          slotId: testSlot.id,
          interval: dummyBooking.interval,
          date: dummyBooking.date,
          bookingNotes,
        });
        // test updating of the db using created thunk and middleware args from stores' setup
        await testThunk(mockDispatch, store.getState, { getFirestore });
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
        const testError = new Error("test");
        const getFirestore = () => {
          throw testError;
        };
        // run the thunk
        const testThunk = updateBookingNotes({
          secretKey,
          slotId: bookingId,
          interval: intervals[0],
          date: baseSlot.date,
          bookingNotes: "",
        });
        const mockDispatch = vi.fn();
        await testThunk(mockDispatch, () => ({} as any), { getFirestore });
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.BookingNotesError),
            variant: NotifVariant.Error,
            error: testError,
          })
        );
      }
    );
  });

  describe("'customerSelfUpdate'", () => {
    testWithEmulator("should update the customer in firestore", async () => {
      // set up initial state
      const store = getNewStore();
      const { organization, db } = await getTestEnv({
        auth: false,
        setup: (db, { organization }) =>
          Promise.all([
            setupTestCustomer({
              db,
              customer: saul,
              organization,
              store,
            }),
          ]),
      });
      const mockDispatch = vi.fn();
      // make sure tested thunk uses test generated organization
      getOrganizationSpy.mockReturnValue(organization);
      // create a thunk curried with test input values
      const testThunk = customerSelfUpdate({ ...saul, name: "Jimmy" });
      // test updating of the db using created thunk and middleware args from stores' setup
      await testThunk(mockDispatch, store.getState, {
        getFirestore: dummyGetFirestore,
      });
      // Check updates
      await waitFor(async () => {
        const bookingsSnap = await getDoc(
          doc(db, getBookingsDocPath(organization, saul.secretKey))
        );
        expect(bookingsSnap.data()).toEqual(
          sanitizeCustomer({ ...saul, name: "Jimmy" })
        );
      });
      expect(mockDispatch).toHaveBeenCalledWith(
        enqueueNotification({
          message: i18n.t(NotificationMessage.CustomerProfileUpdated),
          variant: NotifVariant.Success,
        })
      );
    });

    testWithEmulator(
      "should enqueue error notification if operation failed",
      async () => {
        // intentionally cause an error
        const testError = new Error("test");
        vi.spyOn(functions, "getFunctions").mockImplementationOnce(() => {
          throw testError;
        });
        // run the thunk
        const testThunk = customerSelfUpdate(saul);
        const mockDispatch = vi.fn();
        await testThunk(mockDispatch, () => ({} as any), {
          getFirestore: dummyGetFirestore,
        });
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.CustomerProfileError),
            variant: NotifVariant.Error,
            error: testError,
          })
        );
      }
    );
  });

  describe("'customerSelfRegister'", () => {
    testWithEmulator("should update the customer in firestore", async () => {
      const registrationCode = "TEST_REG_CODE";
      // set up initial state
      const store = getNewStore();
      const { organization, db } = await getTestEnv({
        auth: false,
        setup: async (db, { organization }) => {
          // Set up organization 'registrationCode'
          const docRef = doc(
            db,
            [Collection.Organizations, organization].join("/")
          );
          await setDoc(docRef, { registrationCode }, { merge: true });
        },
      });
      const mockDispatch = vi.fn();
      // make sure tested thunk uses test generated organization
      getOrganizationSpy.mockReturnValue(organization);
      // create a thunk curried with test input values
      const testThunk = customerSelfRegister({
        ...sanitizeCustomer(saul),
        registrationCode,
      });
      // test updating of the db using created thunk and middleware args from stores' setup
      const { id, secretKey } = await testThunk(mockDispatch, store.getState, {
        getFirestore: dummyGetFirestore,
      });
      expect(id).toBeTruthy();
      expect(secretKey).toBeTruthy();
      // Check updates
      await waitFor(async () => {
        const bookingsSnap = await getDoc(
          doc(db, getBookingsDocPath(organization, secretKey))
        );
        expect(bookingsSnap.data()).toEqual({ ...saul, id, secretKey });
      });
      expect(mockDispatch).toHaveBeenCalledWith(
        enqueueNotification({
          message: i18n.t(NotificationMessage.SelfRegSuccess),
          variant: NotifVariant.Success,
        })
      );
    });

    testWithEmulator(
      "should enqueue error notification if operation failed",
      async () => {
        // intentionally cause an error
        const testError = new Error("test");
        vi.spyOn(functions, "getFunctions").mockImplementationOnce(() => {
          throw testError;
        });
        // run the thunk
        const testThunk = customerSelfRegister({
          ...saul,
          registrationCode: "",
        });
        const mockDispatch = vi.fn();
        await testThunk(mockDispatch, () => ({} as any), {
          getFirestore: dummyGetFirestore,
        });
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.SelfRegError),
            variant: NotifVariant.Error,
            error: testError,
          })
        );
      }
    );
  });
});
