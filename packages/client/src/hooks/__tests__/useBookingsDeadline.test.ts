/**
 * @vitest-environment jsdom
 */

import { testHookWithRedux } from "@/__testUtils__/testHooksWithRedux";
import { Action } from "@/enums/store";
import {
  changeCalendarDate,
  setSystemDate,
  storeSecretKey,
} from "@/store/actions/appActions";
import { getNewStore } from "@/store/createStore";
import { saul } from "@eisbuk/testing/customers";
import { DateTime } from "luxon";
import { test, expect, describe } from "vitest";
import useBookingsDeadline from "../useBookingsDeadline";
import { updateLocalDocuments } from "@eisbuk/react-redux-firebase-firestore";
import { OrgSubCollection, sanitizeCustomer } from "@eisbuk/shared";
import { BookingsCountdownVariant } from "@eisbuk/ui";

type IsBookingAllowedTest = {
  isAdmin: boolean;
  /** System date is used for debugging purposes (in the UI), but it also makes testing a bit easier */
  systemDate: string;
  /** Current date in view - this is the month we're observing the bookings for. (string in 'yyyy-mm' is also ok) */
  currentDate: string;
  extendedDate?: string;
  wantIsBookingAllowed: boolean;
};

const runIsBookingAllowedTableTests = (tests: IsBookingAllowedTest[]) => {
  for (const t of tests) {
    const {
      isAdmin,
      systemDate,
      currentDate,
      extendedDate,
      wantIsBookingAllowed,
    } = t;

    test(`isAdmin = ${isAdmin}, systemDate = ${systemDate}, currentDate = ${currentDate}, extendedDate = ${extendedDate}`, () => {
      const store = getNewStore();

      store.dispatch({ type: Action.UpdateAdminStatus, payload: isAdmin });
      store.dispatch(changeCalendarDate(DateTime.fromISO(currentDate)));
      store.dispatch(setSystemDate(DateTime.fromISO(systemDate)));

      // We're using saul's secret key for all tests (not really relevant), but some secret key is required.
      store.dispatch(storeSecretKey(saul.secretKey));
      if (extendedDate) {
        store.dispatch(
          updateLocalDocuments(OrgSubCollection.Bookings, {
            [saul.secretKey]: sanitizeCustomer({ ...saul, extendedDate }),
          })
        );
      }

      const { result } = testHookWithRedux(store, useBookingsDeadline);

      expect(result.isBookingAllowed).toEqual(wantIsBookingAllowed);
    });
  }
};

type CountdownPropsTest = {
  isAdmin: boolean;
  /** System date is used for debugging purposes (in the UI), but it also makes testing a bit easier */
  systemDate: string;
  /** Current date in view - this is the month we're observing the bookings for. (string in 'yyyy-mm' is also ok) */
  currentDate: string;
  extendedDate?: string;
  wantCountdownVariant: BookingsCountdownVariant;
  wantDeadline: string;
};

const runCountdownPropsTableTests = (tests: CountdownPropsTest[]) => {
  for (const t of tests) {
    const {
      isAdmin,
      systemDate,
      currentDate,
      extendedDate,
      wantCountdownVariant,
      wantDeadline,
    } = t;

    test(`isAdmin = ${isAdmin}, systemDate = ${systemDate}, currentDate = ${currentDate}, extendedDate = ${extendedDate}`, () => {
      const store = getNewStore();

      store.dispatch({ type: Action.UpdateAdminStatus, payload: isAdmin });
      store.dispatch(changeCalendarDate(DateTime.fromISO(currentDate)));
      store.dispatch(setSystemDate(DateTime.fromISO(systemDate)));

      // We're using saul's secret key for all tests (not really relevant), but some secret key is required.
      store.dispatch(storeSecretKey(saul.secretKey));
      if (extendedDate) {
        store.dispatch(
          updateLocalDocuments(OrgSubCollection.Bookings, {
            [saul.secretKey]: sanitizeCustomer({ ...saul, extendedDate }),
          })
        );
      }

      const { result } = testHookWithRedux(store, useBookingsDeadline);

      expect(result.countdownVariant).toEqual(wantCountdownVariant);
      expect(result.deadline).toEqual(
        DateTime.fromISO(wantDeadline).endOf("day")
      );
      // Month should always be the month of the current date
      expect(result.month).toEqual(
        DateTime.fromISO(currentDate).startOf("month")
      );
    });
  }
};

describe("useBookingsDeadline", () => {
  describe("'isBookingAllowed'", () =>
    runIsBookingAllowedTableTests([
      // Admins can book at any time
      {
        isAdmin: true,
        systemDate: "2021-03-01",
        currentDate: "2021-02",
        wantIsBookingAllowed: true,
      },

      // Should be able to book before the regular deadline, note: we're using 5 days before end of the month, at 23:59 as deadline.
      {
        isAdmin: false,
        systemDate: "2021-01-26",
        currentDate: "2021-02",
        wantIsBookingAllowed: true,
      },

      // Should not be able to book after the regular deadline (without extended date), note: we're using 5 days before end of the month, at 23:59 as deadline.
      {
        isAdmin: false,
        systemDate: "2021-01-27",
        currentDate: "2021-02",
        wantIsBookingAllowed: false,
      },

      // Should be able to book, even after the regular deadline, if extended date is set and applicable to the given month.
      {
        isAdmin: false,
        systemDate: "2021-01-27",
        currentDate: "2021-02",
        extendedDate: "2021-01-30",
        wantIsBookingAllowed: true,
      },

      // Should not be able to book, after the extended date had passed.
      {
        isAdmin: false,
        systemDate: "2021-01-31",
        currentDate: "2021-02",
        extendedDate: "2021-01-30",
        wantIsBookingAllowed: false,
      },

      // Extended date can be applicable well into the month.
      {
        isAdmin: false,
        // Even though we're (normally) supposed to book a month before, here, with extended date, we can book until the 22nd of the month.
        systemDate: "2021-02-01",
        currentDate: "2021-02",
        extendedDate: "2021-02-22",
        wantIsBookingAllowed: true,
      },

      // Extended date is considered applicable until next month's deadline (at that point it's applicable for the next month)
      {
        isAdmin: false,
        // Regular deadline has passed, but we have an extended date
        systemDate: "2021-01-27",
        currentDate: "2021-02",
        // However, the extended date is no longer applicable for February bookings (it's applicable for March bookings)
        extendedDate: "2021-02-28",
        wantIsBookingAllowed: false,
      },
    ]));

  describe("'countdownProps'", () =>
    runCountdownPropsTableTests([
      // Admins can book at any time
      {
        isAdmin: true,
        systemDate: "2021-03-01",
        currentDate: "2021-02",
        // Admin should also be presented with 'bookings locked' (if that's the case), even though they can book.
        // The reason for this is the debugging of what the customer will see.
        wantCountdownVariant: BookingsCountdownVariant.BookingsLocked,
        wantDeadline: "2021-01-26",
      },

      // No extended date, using regular deadline (5 days before the end of the month prior to currently observed date) - deadline not passed
      {
        isAdmin: false,
        systemDate: "2021-01-26",
        currentDate: "2021-02",
        // Deadline at the end of current system date (there's still time)
        wantCountdownVariant: BookingsCountdownVariant.FirstDeadline,
        wantDeadline: "2021-01-26",
      },

      // No extended date, using regular deadline (5 days before the end of the month prior to currently observed date) - deadline passed
      {
        isAdmin: false,
        systemDate: "2021-01-27",
        currentDate: "2021-02",
        // No extneded date and deadline has passed
        wantCountdownVariant: BookingsCountdownVariant.BookingsLocked,
        wantDeadline: "2021-01-26",
      },

      // After first deadline, but has extended date - should show second deadline warning
      {
        isAdmin: false,
        systemDate: "2021-01-27",
        currentDate: "2021-02",
        extendedDate: "2021-01-30",
        wantCountdownVariant: BookingsCountdownVariant.SecondDeadline,
        // Extended date is applicable for the month, so it's the deadline
        wantDeadline: "2021-01-30",
      },

      // After extended date had passed - should show bookings locked
      {
        isAdmin: false,
        systemDate: "2021-01-31",
        currentDate: "2021-02",
        extendedDate: "2021-01-30",
        wantCountdownVariant: BookingsCountdownVariant.BookingsLocked,
        // Extended date is applicable for the month, so it's the deadline
        wantDeadline: "2021-01-30",
      },
    ]));
});
