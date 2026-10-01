/**
 * @vitest-environment node
 */

import { describe, vi, expect, beforeEach } from "vitest";
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
  acceptPrivacyPolicy,
  getUpdatedBooking,
  BookingConflictError,
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
  setDocInTransaction,
} from "@/utils/firestore";

// The transaction helper runs the real implementation, but a test can make it fail (e.g. as if offline)
vi.mock("@/utils/firestore", async () => {
  const actual =
    await vi.importActual<typeof import("@/utils/firestore")>(
      "@/utils/firestore",
    );
  return {
    ...actual,
    setDocInTransaction: vi.fn(actual.setDocInTransaction),
  };
});

import { testWithEmulator } from "@/__testUtils__/envUtils";
import {
  setupTestBookings,
  setupTestCustomer,
  setupTestSlots,
} from "../__testUtils__/firestore";

import { waitFor, runThunk } from "@/__testUtils__/helpers";

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
        const getFirestore = () => db;
        await runThunk(testThunk, mockDispatch, store.getState, {
          getFirestore,
        });
        // get all `bookedSlots` for customer
        const bookedSlotsForCustomer = await getDocs(
          collection(db, getBookedSlotsPath(organization, secretKey)),
        );
        // the updated `bookedSlots` should contain 2 default entries and one new (testBooking)
        expect(bookedSlotsForCustomer.docs.length).toEqual(3);
        // check the updated booking
        const updatedBooking = (
          await getDoc(
            doc(db, getBookedSlotDocPath(organization, secretKey, bookingId)),
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
          }),
        );
      },
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
        await runThunk(testThunk, mockDispatch, () => ({}) as any, {
          getFirestore,
        });
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.BookingError, {
              date: DateTime.fromISO(baseSlot.date),
              interval: intervals[0],
            }),
            variant: NotifVariant.Error,
            error: testError,
          }),
        );
      },
    );
  });

  describe("'bookInterval' with an existing booking for the same lesson (#982)", () => {
    const [intervalA, intervalB, intervalC] = intervals;
    const bookingNotes = "Arriving 10 minutes late";

    /**
     * Sets up the test slot and (optionally) an existing booking for it, returns the thunk runner and a booking getter.
     */
    const setup = async (existingBooking?: CustomerBookingEntry) => {
      const store = getNewStore();
      const { db, organization } = await getTestEnv({
        auth: false,
        setup: (db, { organization }) =>
          Promise.all([
            setupTestSlots({
              db,
              store,
              slots: { [bookingId]: testSlot },
              organization,
            }),
            setupTestBookings({
              db,
              store,
              bookedSlots: existingBooking
                ? { [bookingId]: existingBooking }
                : {},
              customer: saul,
              organization,
            }),
          ]),
      });
      getOrganizationSpy.mockReturnValue(organization);
      const mockDispatch = vi.fn();

      const book = (interval: string, replacedInterval?: string) =>
        runThunk(
          bookInterval({
            secretKey,
            slotId: bookingId,
            interval,
            date: testSlot.date,
            replacedInterval,
          }),
          mockDispatch,
          store.getState,
          { getFirestore: () => db },
        );

      const bookingPath = getBookedSlotDocPath(
        organization,
        secretKey,
        bookingId,
      );

      const getBooking = async () =>
        (await getDoc(doc(db, bookingPath))).data();

      /** Reads the booking from the server, with a different client (not affected by the test client's cache or network) */
      const getServerBooking = async () => {
        let booking: CustomerBookingEntry | undefined;
        await db.testEnv.withSecurityRulesDisabled(async (ctx) => {
          const snap = await ctx.firestore().doc(bookingPath).get();
          booking = snap.data() as CustomerBookingEntry | undefined;
        });
        return booking;
      };

      /** Deletes the booking on the server, with a different client (e.g. cancelled from another device) */
      const deleteServerBooking = () =>
        db.testEnv.withSecurityRulesDisabled((ctx) =>
          ctx.firestore().doc(bookingPath).delete(),
        );

      return {
        book,
        getBooking,
        getServerBooking,
        deleteServerBooking,
        mockDispatch,
        db,
        bookingPath,
      };
    };

    const successNotification = (interval: string) =>
      enqueueNotification({
        message: i18n.t(NotificationMessage.BookingSuccess, {
          date: DateTime.fromISO(testSlot.date),
          interval,
        }),
        variant: NotifVariant.Success,
      });
    const alreadyBookedNotification = (bookedInterval: string) =>
      enqueueNotification({
        message: i18n.t(NotificationMessage.BookingAlreadyExists, {
          date: DateTime.fromISO(testSlot.date),
          interval: bookedInterval,
        }),
        variant: NotifVariant.Error,
      });

    testWithEmulator(
      "should not change the booking when another interval is booked without an explicit replacement",
      async () => {
        const { book, getBooking, mockDispatch } = await setup({
          date: testSlot.date,
          interval: intervalA,
          bookingNotes,
        });

        await book(intervalB);

        expect(await getBooking()).toEqual({
          date: testSlot.date,
          interval: intervalA,
          bookingNotes,
        });
        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith(
          alreadyBookedNotification(intervalA),
        );
      },
    );

    testWithEmulator(
      "should replace the booked interval, keeping the booking notes, when the replacement is explicit",
      async () => {
        const { book, getBooking, mockDispatch } = await setup({
          date: testSlot.date,
          interval: intervalA,
          bookingNotes,
        });

        await book(intervalB, intervalA);

        expect(await getBooking()).toEqual({
          date: testSlot.date,
          interval: intervalB,
          bookingNotes,
        });
        expect(mockDispatch).toHaveBeenCalledWith(
          successNotification(intervalB),
        );
      },
    );

    testWithEmulator(
      "should not replace the booking if it changed after the athlete confirmed the replacement",
      async () => {
        // Athlete confirmed replacing A with B, but meanwhile (e.g. from another device) the booking was changed to C
        const { book, getBooking, mockDispatch } = await setup({
          date: testSlot.date,
          interval: intervalC,
        });

        await book(intervalB, intervalA);

        expect(await getBooking()).toEqual({
          date: testSlot.date,
          interval: intervalC,
        });
        expect(mockDispatch).toHaveBeenCalledWith(
          alreadyBookedNotification(intervalC),
        );
      },
    );

    testWithEmulator(
      "should leave the booking (and its notes) as is when booking the interval already booked",
      async () => {
        const { book, getBooking } = await setup({
          date: testSlot.date,
          interval: intervalA,
          bookingNotes,
        });

        await book(intervalA);

        expect(await getBooking()).toEqual({
          date: testSlot.date,
          interval: intervalA,
          bookingNotes,
        });
      },
    );

    testWithEmulator(
      "should book exactly one interval when two intervals of a lesson not booked yet are clicked in quick succession",
      async () => {
        const { book, getBooking, mockDispatch } = await setup();

        // Second click happens while the first write is still in flight
        await Promise.all([book(intervalA), book(intervalB)]);

        const booking = await getBooking();
        expect([intervalA, intervalB]).toContain(booking?.interval);
        const otherInterval =
          booking?.interval === intervalA ? intervalB : intervalA;
        // One click booked, the other one was refused (didn't replace the first one)
        expect(mockDispatch).toHaveBeenCalledTimes(2);
        expect(mockDispatch).toHaveBeenCalledWith(
          successNotification(booking!.interval),
        );
        expect(mockDispatch).toHaveBeenCalledWith(
          alreadyBookedNotification(booking!.interval),
        );
        expect(mockDispatch).not.toHaveBeenCalledWith(
          successNotification(otherInterval),
        );
      },
    );

    const changedMeanwhileNotification = () =>
      enqueueNotification({
        message: i18n.t(NotificationMessage.BookingChangedMeanwhile, {
          date: DateTime.fromISO(testSlot.date),
        }),
        variant: NotifVariant.Error,
      });

    testWithEmulator(
      "should not recreate a booking cancelled (e.g. from another device) before the replacement was confirmed",
      async () => {
        // The athlete opened the replace dialog for A -> B, meanwhile A was cancelled
        const { book, getServerBooking, mockDispatch } = await setup();

        await book(intervalB, intervalA);

        expect(await getServerBooking()).toBeUndefined();
        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith(
          changedMeanwhileNotification(),
        );
      },
    );

    testWithEmulator(
      "should not recreate a booking cancelled while the replacement transaction runs (the retry sees it's gone)",
      async () => {
        const { db, bookingPath, deleteServerBooking, getServerBooking } =
          await setup({
            date: testSlot.date,
            interval: intervalA,
            bookingNotes,
          });

        const seenBookings: (CustomerBookingEntry | undefined)[] = [];
        const replacement = setDocInTransaction(
          doc(db, bookingPath),
          async (booking) => {
            seenBookings.push(booking as CustomerBookingEntry | undefined);
            // Cancelled from another device after the transaction read the booking, before it commits
            if (seenBookings.length === 1) await deleteServerBooking();
            return getUpdatedBooking(booking as CustomerBookingEntry, {
              interval: intervalB,
              date: testSlot.date,
              replacedInterval: intervalA,
            });
          },
        );

        await expect(replacement).rejects.toEqual(
          new BookingConflictError(null),
        );
        // First attempt saw the booking, the commit failed, the retry saw it deleted (and refused)
        expect(seenBookings).toEqual([
          { date: testSlot.date, interval: intervalA, bookingNotes },
          undefined,
        ]);
        expect(await getServerBooking()).toBeUndefined();
      },
    );

    const offlineError = () =>
      Object.assign(new Error("client is offline"), { code: "unavailable" });

    testWithEmulator(
      "without a connection, a first booking is kept on the device (pending) and sent when the connection returns",
      async () => {
        const { book, db, getServerBooking, mockDispatch } = await setup();
        const client = (db as any).instance;

        // Network down: the transaction can't reach the server, regular writes are queued
        await client.disableNetwork();
        vi.mocked(setDocInTransaction).mockRejectedValueOnce(offlineError());

        let done = false;
        const booking = book(intervalA).then(() => (done = true));

        await waitFor(() =>
          expect(mockDispatch).toHaveBeenCalledWith(
            enqueueNotification({
              message: i18n.t(NotificationMessage.BookingPendingOffline, {
                date: DateTime.fromISO(testSlot.date),
                interval: intervalA,
              }),
              variant: NotifVariant.Error,
            }),
          ),
        );
        // Pending: not on the server, no success message yet
        await new Promise((resolve) => setTimeout(resolve, 1000));
        expect(done).toEqual(false);
        expect(await getServerBooking()).toBeUndefined();
        expect(mockDispatch).not.toHaveBeenCalledWith(
          successNotification(intervalA),
        );

        // Connection back: the queued write reaches the server
        await client.enableNetwork();
        await booking;
        expect(await getServerBooking()).toEqual({
          date: testSlot.date,
          interval: intervalA,
        });
        expect(mockDispatch).toHaveBeenCalledWith(
          successNotification(intervalA),
        );
      },
    );

    testWithEmulator(
      "without a connection, a booking is never replaced (neither explicitly nor by a first-booking click)",
      async () => {
        const { book, getServerBooking, mockDispatch } = await setup({
          date: testSlot.date,
          interval: intervalA,
        });

        // Explicit replacement needs the server: refused with an error
        vi.mocked(setDocInTransaction).mockRejectedValueOnce(offlineError());
        await book(intervalB, intervalA);
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({
              message: i18n.t(NotificationMessage.BookingError, {
                date: DateTime.fromISO(testSlot.date),
                interval: intervalB,
              }),
            }),
          }),
        );

        // A click treated as a first booking is checked against the local bookings (which have A)
        vi.mocked(setDocInTransaction).mockRejectedValueOnce(offlineError());
        await book(intervalB);
        expect(mockDispatch).toHaveBeenCalledWith(
          alreadyBookedNotification(intervalA),
        );

        expect(await getServerBooking()).toEqual({
          date: testSlot.date,
          interval: intervalA,
        });
      },
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
        await runThunk(testThunk, mockDispatch, store.getState, {
          getFirestore,
        });
        // get all `bookedSlots` for customer
        const bookedSlotsForCustomer = await getDocs(
          collection(db, getBookedSlotsPath(organization, secretKey)),
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
          }),
        );
      },
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
        await runThunk(testThunk, mockDispatch, () => ({}) as any, {
          getFirestore,
        });
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.BookingCanceledError, {
              date: DateTime.fromISO(baseSlot.date),
              interval: intervals[0],
            }),
            variant: NotifVariant.Error,
            error: testError,
          }),
        );
      },
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
        const getFirestore = () => db;
        // create a thunk curried with test input values
        const testThunk = updateBookingNotes({
          secretKey,
          slotId: testSlot.id,
          interval: dummyBooking.interval,
          date: dummyBooking.date,
          bookingNotes,
        });
        // test updating of the db using created thunk and middleware args from stores' setup
        await runThunk(testThunk, mockDispatch, store.getState, {
          getFirestore,
        });
        // Check updates
        const updatedBooking = await getDoc(
          doc(
            db,
            getBookedSlotDocPath(organization, saul.secretKey, testSlot.id),
          ),
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
          }),
        );
      },
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
        await runThunk(testThunk, mockDispatch, () => ({}) as any, {
          getFirestore,
        });
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.BookingNotesError),
            variant: NotifVariant.Error,
            error: testError,
          }),
        );
      },
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
      await runThunk(testThunk, mockDispatch, store.getState);
      // Check updates
      await waitFor(async () => {
        const bookingsSnap = await getDoc(
          doc(db, getBookingsDocPath(organization, saul.secretKey)),
        );
        expect(bookingsSnap.data()).toEqual(
          sanitizeCustomer({ ...saul, name: "Jimmy" }),
        );
      });
      expect(mockDispatch).toHaveBeenCalledWith(
        enqueueNotification({
          message: i18n.t(NotificationMessage.CustomerProfileUpdated),
          variant: NotifVariant.Success,
        }),
      );
    });

    testWithEmulator(
      "should enqueue error notification if operation failed",
      async () => {
        // intentionally cause an error
        const testError = new Error("test");
        const getFunctions = () => {
          throw testError;
        };
        // run the thunk
        const testThunk = customerSelfUpdate(saul);
        const mockDispatch = vi.fn();
        await runThunk(testThunk, mockDispatch, () => ({}) as any, {
          getFunctions,
        });
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.CustomerProfileError),
            variant: NotifVariant.Error,
            error: testError,
          }),
        );
      },
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
            [Collection.Organizations, organization].join("/"),
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
      const { id, secretKey } = await runThunk(
        testThunk,
        mockDispatch,
        store.getState,
      );
      expect(id).toBeTruthy();
      expect(secretKey).toBeTruthy();
      // Check updates
      await waitFor(async () => {
        const bookingsSnap = await getDoc(
          doc(db, getBookingsDocPath(organization, secretKey)),
        );
        expect(bookingsSnap.data()).toEqual({ ...saul, id, secretKey });
      });
      expect(mockDispatch).toHaveBeenCalledWith(
        enqueueNotification({
          message: i18n.t(NotificationMessage.SelfRegSuccess),
          variant: NotifVariant.Success,
        }),
      );
    });

    testWithEmulator(
      "should enqueue error notification if operation failed",
      async () => {
        // intentionally cause an error
        const testError = new Error("test");
        const getFunctions = () => {
          throw testError;
        };
        // run the thunk
        const testThunk = customerSelfRegister({
          ...saul,
          registrationCode: "",
        });
        const mockDispatch = vi.fn();
        await runThunk(testThunk, mockDispatch, () => ({}) as any, {
          getFunctions,
        });
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.SelfRegError),
            variant: NotifVariant.Error,
            error: testError,
          }),
        );
      },
    );

    testWithEmulator(
      "should return codeOk: false when the backend explicitly rejects the registration code",
      async () => {
        const invalidCodeError = Object.assign(new Error("invalid code"), {
          code: "functions/unauthenticated",
        });
        const getFunctions = () => {
          throw invalidCodeError;
        };
        const testThunk = customerSelfRegister({
          ...saul,
          registrationCode: "wrong-code",
        });
        const mockDispatch = vi.fn();
        const res = await runThunk(testThunk, mockDispatch, () => ({}) as any, {
          getFunctions,
        });
        expect(res.codeOk).toEqual(false);
      },
    );

    testWithEmulator(
      "should not blame the registration code for unrelated failures (regression: #964)",
      async () => {
        // e.g. a flaky network / cold start - nothing to do with the code
        const networkError = Object.assign(new Error("deadline exceeded"), {
          code: "functions/deadline-exceeded",
        });
        const getFunctions = () => {
          throw networkError;
        };
        const testThunk = customerSelfRegister({
          ...saul,
          registrationCode: "correct-code",
        });
        const mockDispatch = vi.fn();
        const res = await runThunk(testThunk, mockDispatch, () => ({}) as any, {
          getFunctions,
        });
        // No misleading "invalid registration code" field error...
        expect(res.codeOk).toEqual(true);
        // ...but the registration did fail (no secretKey to proceed with)
        expect(res.secretKey).toEqual("");
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.SelfRegError),
            variant: NotifVariant.Error,
            error: networkError,
          }),
        );
      },
    );
  });

  describe("'acceptPrivacyPolicy'", () => {
    testWithEmulator(
      "should store timestamp of policy acceptance",
      async () => {
        // set up initial state
        const store = getNewStore();
        const { organization, db } = await getTestEnv({
          auth: false,
          setup: (db, { organization }) =>
            setupTestCustomer({
              db,
              customer: saul,
              organization,
              store,
            }),
        });
        const mockDispatch = vi.fn();
        // make sure tested thunk uses test generated organization
        getOrganizationSpy.mockReturnValue(organization);
        // create a thunk curried with test input values
        const testThunk = acceptPrivacyPolicy(saul);
        const timestampDate = DateTime.now().toISO().slice(0, 10);
        // test updating of the db using created thunk and middleware args from stores' setup
        await runThunk(testThunk, mockDispatch, store.getState);
        // Check updates
        await waitFor(async () => {
          const bookingsSnap = await getDoc(
            doc(db, getBookingsDocPath(organization, saul.secretKey)),
          );
          expect(bookingsSnap.data()?.privacyPolicyAccepted).toEqual({
            timestamp: expect.stringContaining(timestampDate),
          });
        });
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.SelectionSaved),
            variant: NotifVariant.Success,
          }),
        );
      },
    );

    testWithEmulator(
      "should enqueue error notification if operation failed",
      async () => {
        // intentionally cause an error
        const testError = new Error("test");
        const getFunctions = () => {
          throw testError;
        };
        // run the thunk
        const testThunk = acceptPrivacyPolicy(saul);
        const mockDispatch = vi.fn();
        await runThunk(testThunk, mockDispatch, () => ({}) as any, {
          getFunctions,
        });
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.Error),
            variant: NotifVariant.Error,
            error: testError,
          }),
        );
      },
    );
  });
});
