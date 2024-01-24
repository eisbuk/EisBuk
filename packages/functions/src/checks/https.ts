import * as functions from "firebase-functions";
import admin from "firebase-admin";

import { SanityCheckKind } from "@eisbuk/shared";

import { __functionsZone__ } from "../constants";
import { wrapHttpsOnCallHandler } from "../sentry-serverless-firebase";

import { checkUser, throwUnauth } from "../utils";

import { newSanityChecker } from "./api";

import {
  attendanceSlotMismatchAutofix,
  bookingsAutofix,
} from "./slotAttendance";
import { slotsSlotsByDayAutofix } from "./slotSlotsByDay";
import { bookedSlotsAttendanceAutofix } from "./bookingsAttendance";

/**
 * Goes through all 'slotsByDay' entries, checks each date to see if there are no slots in the day and deletes the day if empty.
 * If all days are empty, deletes the entry (for a month) altogether.
 */
export const dbSlotAttendanceCheck = functions
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .https.onCall(
    async ({ organization }: { organization: string }, { auth }) => {
      if (!(await checkUser(organization, auth))) throwUnauth();

      const db = admin.firestore();
      return newSanityChecker(
        db,
        organization,
        SanityCheckKind.SlotAttendance
      ).checkAndWrite();
    }
  );

/**
 * Goes through all 'slotsByDay' entries, checks each date to see if there are no slots in the day and deletes the day if empty.
 * If all days are empty, deletes the entry (for a month) altogether.
 */
export const dbSlotSlotsByDayCheck = functions
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .https.onCall(
    wrapHttpsOnCallHandler(
      "dbSlotSlotsByDayCheck",
      async ({ organization }: { organization: string }, { auth }) => {
        if (!(await checkUser(organization, auth))) throwUnauth();

        const db = admin.firestore();
        return newSanityChecker(
          db,
          organization,
          SanityCheckKind.SlotSlotsByDay
        ).checkAndWrite();
      }
    )
  );

export const dbSlotBookingsCheck = functions
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .https.onCall(
    async ({ organization }: { organization: string }, { auth }) => {
      if (!(await checkUser(organization, auth))) throwUnauth();

      const db = admin.firestore();
      return newSanityChecker(
        db,
        organization,
        SanityCheckKind.SlotBookings
      ).checkAndWrite();
    }
  );

export const dbBookedSlotsAttendanceCheck = functions
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .https.onCall(
    wrapHttpsOnCallHandler(
      "dbBookedSlotsAttendanceCheck",
      async ({ organization }: { organization: string }, { auth }) => {
        if (!(await checkUser(organization, auth))) throwUnauth();

        const db = admin.firestore();
        return newSanityChecker(
          db,
          organization,
          SanityCheckKind.BookedSlotsAttendance
        ).checkAndWrite();
      }
    )
  );

export const dbSlotAttendanceAutofix = functions
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .https.onCall(
    wrapHttpsOnCallHandler(
      "dbSlotAttendanceAutofix",
      async ({ organization }: { organization: string }, { auth }) => {
        if (!(await checkUser(organization, auth))) throwUnauth();

        const db = admin.firestore();
        const checker = newSanityChecker(
          db,
          organization,
          SanityCheckKind.SlotAttendance
        );

        const report = await checker
          .getLatestReport()
          // If report doesn't exist, or the latest report had already been fixed, get the new report
          .then((r) => (!r || r.attendanceFixes ? checker.checkAndWrite() : r));

        const attendanceFixes = await attendanceSlotMismatchAutofix(
          db,
          organization,
          report
        );
        checker.writeReport({ ...report, attendanceFixes });

        return attendanceFixes;
      }
    )
  );

export const dbSlotSlotsByDayAutofix = functions
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .https.onCall(
    wrapHttpsOnCallHandler(
      "dbSlotSlotsByDayAutofix",
      async ({ organization }: { organization: string }, { auth }) => {
        if (!(await checkUser(organization, auth))) throwUnauth();

        const db = admin.firestore();
        const checker = newSanityChecker(
          db,
          organization,
          SanityCheckKind.SlotSlotsByDay
        );

        const report = await checker
          .getLatestReport()
          // If report doesn't exist, or the latest report had already been fixed, get the new report
          .then((r) => (!r || r.slotsByDayFixes ? checker.checkAndWrite() : r));

        const slotsByDayFixes = await slotsSlotsByDayAutofix(
          db,
          organization,
          report
        );
        checker.writeReport({ ...report, slotsByDayFixes });

        return slotsByDayFixes;
      }
    )
  );

export const dbSlotBookingsAutofix = functions
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .https.onCall(
    wrapHttpsOnCallHandler(
      "dbSlotBookingsAutofix",
      async ({ organization }: { organization: string }, { auth }) => {
        if (!(await checkUser(organization, auth))) throwUnauth();

        const db = admin.firestore();
        const checker = newSanityChecker(
          db,
          organization,
          SanityCheckKind.SlotBookings
        );

        const report = await checker
          .getLatestReport()
          .then((r) => (!r || r.bookingsFixes ? checker.checkAndWrite() : r));

        const bookingsFixes = await bookingsAutofix(db, organization, report);
        checker.writeReport({ ...report, bookingsFixes });

        return bookingsFixes;
      }
    )
  );

export const dbBookedSlotsAttendanceAutofix = functions
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .https.onCall(
    wrapHttpsOnCallHandler(
      "dbBookedSlotsAttendanceAutofix",
      async ({ organization }: { organization: string }, { auth }) => {
        if (!(await checkUser(organization, auth))) throwUnauth();

        const db = admin.firestore();
        const checker = newSanityChecker(
          db,
          organization,
          SanityCheckKind.BookedSlotsAttendance
        );

        const report = await checker
          .getLatestReport()
          .then((r) => (!r || r.attendanceFixes ? checker.checkAndWrite() : r));

        const attendanceFixes = await bookedSlotsAttendanceAutofix(
          db,
          organization,
          report
        );
        checker.writeReport({ ...report, attendanceFixes });

        return attendanceFixes;
      }
    )
  );
