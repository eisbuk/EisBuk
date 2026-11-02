/**
 * @vitest-environment jsdom
 */

import { describe, test, vi, expect, beforeEach, afterEach } from "vitest";
import * as Sentry from "@sentry/react";
import { FirestoreError } from "@firebase/firestore";
import { DateTime } from "luxon";

import i18n, { NotificationMessage } from "@eisbuk/translations";

import { saul } from "@eisbuk/testing/customers";
import { baseSlot } from "@eisbuk/testing/slots";

import { NotifVariant } from "@/enums/store";

import { RELOAD_DELAY_MS } from "@/lib/storageRecovery";

import { enqueueNotification } from "@/features/notifications/actions";

import { runThunk } from "@/__testUtils__/helpers";

vi.mock("@sentry/react", () => ({
  captureMessage: vi.fn(),
  captureException: vi.fn(),
  flush: vi.fn(() => Promise.resolve(true)),
  Severity: { Warning: "warning" },
}));

/** `FirestoreError`'s constructor is private in the typings, but it's the real class the SDK throws */
const firestoreError = (code: string, message: string) =>
  new (FirestoreError as unknown as new (
    code: string,
    message: string
  ) => FirestoreError)(code, message);

const payload = {
  secretKey: saul.secretKey,
  slotId: "slot-id",
  interval: Object.keys(baseSlot.intervals)[0],
  date: baseSlot.date,
  bookingNotes: "",
};

const getState = () =>
  ({ firestore: { data: { bookedSlots: { "slot-id": {} } } } } as any);

const reload = vi.fn();

/**
 * Loads the thunks with a fresh recovery state (as after a page load)
 */
const loadThunks = async () => {
  vi.resetModules();
  return import("../bookingOperations.js");
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  window.sessionStorage.clear();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...window.location, reload },
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Booking operations: failed writes", () => {
  test.each(["bookInterval", "cancelBooking", "updateBookingNotes"] as const)(
    "%s: a broken browser storage shows the recovery notice (not the usual error) and reloads the page",
    async (operation) => {
      const thunk = (await loadThunks())[operation];
      // What Firestore throws once its internal queue failed after an IndexedDB error
      const error = new Error(
        "FIRESTORE (9.22.1) INTERNAL ASSERTION FAILED: Unexpected state"
      );
      const getFirestore = () => {
        throw error;
      };
      const mockDispatch = vi.fn();

      await runThunk(thunk(payload), mockDispatch, getState, {
        getFirestore,
      });

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith(
        enqueueNotification({
          message: i18n.t(NotificationMessage.StorageReloading),
          variant: NotifVariant.Error,
          error,
        })
      );
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        "Browser storage failure: reloading the page",
        expect.objectContaining({
          tags: expect.objectContaining({
            storageRecovery: "write-failed",
            operation,
          }),
        })
      );

      await vi.advanceTimersByTimeAsync(RELOAD_DELAY_MS);
      expect(reload).toHaveBeenCalledTimes(1);
    }
  );

  test("an ordinary failure shows the usual error and is reported to Sentry with its code", async () => {
    const { bookInterval } = await loadThunks();
    const error = firestoreError(
      "permission-denied",
      "Missing or insufficient permissions."
    );
    const getFirestore = () => {
      throw error;
    };
    const mockDispatch = vi.fn();

    await runThunk(bookInterval(payload), mockDispatch, getState, {
      getFirestore,
    });

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(
      enqueueNotification({
        message: i18n.t(NotificationMessage.BookingError, {
          date: DateTime.fromISO(payload.date),
          interval: payload.interval,
        }),
        variant: NotifVariant.Error,
        error,
      })
    );
    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { operation: "bookInterval", errorCode: "permission-denied" },
    });
    await vi.runAllTimersAsync();
    expect(reload).not.toHaveBeenCalled();
  });
});
