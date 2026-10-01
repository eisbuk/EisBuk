import { DateTime } from "luxon";
import _ from "lodash";

import {
  BookedSlotsAttendanceSanityCheckReport,
  BookedSlotsAttendanceAutofixReport,
} from "@eisbuk/shared";

import { Firestore } from "./types";

import { reconcileBookingDerivedData } from "./bookingDerivedData";

/** The check and the autofix cover lessons from the beginning of the T-3 month on */
const getFrom = () =>
  DateTime.now().minus({ months: 3 }).startOf("month").toFormat("yyyy-MM");
const to = "9999-12";

/**
 * A util used by slot related check cloud function used to find mismatch between slot and attendance entries.
 *
 * It's the attendance part of the booking-derived data check (`reconcileBookingDerivedData`), in this report's
 * shape: the same booking counts when an athlete holds more than one for a slot (`selectBooking`), and malformed
 * entries are read the same way. Reported:
 * - missing: a booking without an attendance entry
 * - stray: an entry claiming a booking that doesn't exist (attendance recorded without a booking isn't reported)
 * - mismatched: an entry whose booked interval differs from the booking's
 */
export const findBookedSlotsAttendanceMismatches = async (
  db: Firestore,
  organization: string
): Promise<BookedSlotsAttendanceSanityCheckReport> => {
  const { attendance } = await reconcileBookingDerivedData(db, organization, {
    from: getFrom(),
    to,
    counts: false,
    attendedSlots: false,
  });

  const report: BookedSlotsAttendanceSanityCheckReport = {
    id: DateTime.now().toISO(),
    strayAttendances: {},
    mismatchedAttendances: {},
    missingAttendances: {},
  };
  for (const { slotId, customerId, booking, before } of attendance) {
    // Using _.set as a convenience method to create all of the parent nodes for the property (if they don't exist)
    if (booking && !before) {
      _.set(report, ["missingAttendances", slotId, customerId], { booking });
    } else if (!booking && before?.bookedInterval) {
      _.set(report, ["strayAttendances", slotId, customerId], {
        attendance: before,
      });
    } else if (
      booking &&
      before &&
      before.bookedInterval !== booking.interval
    ) {
      _.set(report, ["mismatchedAttendances", slotId, customerId], {
        booking,
        attendance: before,
      });
    }
  }
  return report;
};

/**
 * Repairs the attendance entries that contradict the bookings, for lessons from the beginning of the T-3 month on
 * (the same period as the check).
 *
 * It used to write both intervals from a (possibly old) check report, overwriting the attended interval recorded
 * by the admin. It now re-derives each entry from the current booking with the sync the data triggers use, so the
 * admin's attended interval is kept and bookings changed in the meantime are respected (see `bookingDerivedData.ts`).
 */
export const bookedSlotsAttendanceAutofix = async (
  db: Firestore,
  organization: string
): Promise<BookedSlotsAttendanceAutofixReport> => {
  const report: BookedSlotsAttendanceAutofixReport = {
    timestamp: DateTime.now().toISO(),
    created: {},
    deleted: {},
    updated: {},
  };

  const { attendance } = await reconcileBookingDerivedData(db, organization, {
    from: getFrom(),
    to,
    apply: true,
    counts: false,
    attendedSlots: false,
  });

  for (const { slotId, customerId, before, after, skipped } of attendance) {
    if (skipped || _.isEqual(before, after)) continue;
    // Using _.set as a convenience method to create all of the parent nodes for the property (if they don't exist)
    if (!before) {
      _.set(report, ["created", slotId, customerId], { after });
    } else if (!after) {
      _.set(report, ["deleted", slotId, customerId], { before });
    } else {
      _.set(report, ["updated", slotId, customerId], { before, after });
    }
  }

  return report;
};
