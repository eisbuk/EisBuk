import * as functions from "firebase-functions";
import admin from "firebase-admin";

import { SanityCheckKind } from "@eisbuk/shared";

import { __functionsZone__ } from "../constants";
import { wrapHttpsOnCallHandler } from "../sentry-serverless-firebase";

import { checkIsAdmin, throwUnauth, EisbukHttpsError } from "../utils";

import { newSanityChecker, SanityChecker } from "./api";

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
      if (!(await checkIsAdmin(organization, auth))) throwUnauth();

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
        if (!(await checkIsAdmin(organization, auth))) throwUnauth();

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
      if (!(await checkIsAdmin(organization, auth))) throwUnauth();

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
        if (!(await checkIsAdmin(organization, auth))) throwUnauth();

        const db = admin.firestore();
        return newSanityChecker(
          db,
          organization,
          SanityCheckKind.BookedSlotsAttendance
        ).checkAndWrite();
      }
    )
  );


// ==================================================================
// Internal Logic Functions (called by https and scheduled tasks)
// ==================================================================

/**
 * Internal logic for running Slot / Attendance autofix.
 * Gets/Generates the latest report and applies fixes.
 */
async function _runSlotAttendanceAutofixInternal(
  db: admin.firestore.Firestore,
  organization: string
): Promise<any> { // Return type matches original https function for now
  functions.logger.info(`[${organization}] Starting _runSlotAttendanceAutofixInternal`);
  try {
    const checker = newSanityChecker(
      db,
      organization,
      SanityCheckKind.SlotAttendance
    );

    // Get latest report, or generate a new one if latest doesn't exist or was already fixed
    const report = await checker
      .getLatestReport()
      .then((r) => (!r || r.attendanceFixes ? checker.checkAndWrite() : r));

    if (!report) {
        functions.logger.warn(`[${organization}] No report found or generated for SlotAttendance autofix.`);
        return { message: "No report available to fix." }; // Or appropriate response
    }

    // Check if fixes are actually needed based on the report content
    if (!report.unpairedEntries || Object.keys(report.unpairedEntries).length === 0) {
        functions.logger.info(`[${organization}] SlotAttendance report shows no unpaired entries to fix.`);
        // Optionally write back the report marking it as checked/fixed if it wasn't already
        if (!report.attendanceFixes) {
            const emptyFixes = { timestamp: new Date().toISOString(), created: {}, deleted: {}, updated: {} };
            await checker.writeReport({ ...report, attendanceFixes: emptyFixes });
            functions.logger.info(`[${organization}] Marked SlotAttendance report ${report.id} as checked (no fixes needed).`);
        }
        return { message: "No fixes needed based on the report." };
    }


    functions.logger.info(`[${organization}] Applying SlotAttendance autofix based on report ${report.id}`);
    const attendanceFixes = await attendanceSlotMismatchAutofix(
      db,
      organization,
      report
    );

    // Write the original report back, now including the fixes applied
    await checker.writeReport({ ...report, attendanceFixes });
    functions.logger.info(`[${organization}] Completed SlotAttendance autofix and updated report ${report.id}`);

    return attendanceFixes; // Return the result of the autofix operation
  } catch (error) {
    functions.logger.error(`[${organization}] Error in _runSlotAttendanceAutofixInternal:`, error);
    throw error; // Re-throw
  }
}

/**
 * Internal logic for running Slot / SlotsByDay autofix.
 * Gets/Generates the latest report and applies fixes.
 */
async function _runSlotSlotsByDayAutofixInternal(
  db: admin.firestore.Firestore,
  organization: string
): Promise<any> {
  functions.logger.info(`[${organization}] Starting _runSlotSlotsByDayAutofixInternal`);
   try {
    const checker = newSanityChecker(
      db,
      organization,
      SanityCheckKind.SlotSlotsByDay
    );

    const report = await checker
      .getLatestReport()
      .then((r) => (!r || r.slotsByDayFixes ? checker.checkAndWrite() : r));

     if (!report) {
        functions.logger.warn(`[${organization}] No report found or generated for SlotSlotsByDay autofix.`);
        return { message: "No report available to fix." };
    }

     // Check if fixes are needed
    if ((!report.straySlotsByDayEntries || Object.keys(report.straySlotsByDayEntries).length === 0) &&
        (!report.missingSlotsByDayEntries || Object.keys(report.missingSlotsByDayEntries).length === 0) &&
        (!report.mismatchedEntries || Object.keys(report.mismatchedEntries).length === 0)) {
        functions.logger.info(`[${organization}] SlotSlotsByDay report shows no inconsistencies to fix.`);
        if (!report.slotsByDayFixes) {
             const emptyFixes = { timestamp: new Date().toISOString(), created: [], deleted: [], updated: {}, addedIds: [] };
             await checker.writeReport({ ...report, slotsByDayFixes: emptyFixes });
             functions.logger.info(`[${organization}] Marked SlotSlotsByDay report ${report.id} as checked (no fixes needed).`);
        }
        return { message: "No fixes needed based on the report." };
    }

    functions.logger.info(`[${organization}] Applying SlotSlotsByDay autofix based on report ${report.id}`);
    const slotsByDayFixes = await slotsSlotsByDayAutofix(
      db,
      organization,
      report
    );

    await checker.writeReport({ ...report, slotsByDayFixes });
    functions.logger.info(`[${organization}] Completed SlotSlotsByDay autofix and updated report ${report.id}`);

    return slotsByDayFixes;
  } catch (error) {
    functions.logger.error(`[${organization}] Error in _runSlotSlotsByDayAutofixInternal:`, error);
    throw error; // Re-throw
  }
}


/**
 * Internal logic for running Slot / Bookings autofix.
 * Gets/Generates the latest report and applies fixes.
 */
async function _runSlotBookingsAutofixInternal(
  db: admin.firestore.Firestore,
  organization: string
): Promise<any> {
  functions.logger.info(`[${organization}] Starting _runSlotBookingsAutofixInternal`);
  try {
    const checker = newSanityChecker(
      db,
      organization,
      SanityCheckKind.SlotBookings
    );

    const report = await checker
      .getLatestReport()
      .then((r) => (!r || r.bookingsFixes ? checker.checkAndWrite() : r));

    if (!report) {
        functions.logger.warn(`[${organization}] No report found or generated for SlotBookings autofix.`);
        return { message: "No report available to fix." };
    }

     // Check if fixes are needed
    if ((!report.strayBookings || Object.keys(report.strayBookings).length === 0) &&
        (!report.dateMismatches || Object.keys(report.dateMismatches).length === 0) &&
        (!report.invalidIntervalBookings || Object.keys(report.invalidIntervalBookings).length === 0)) {
        functions.logger.info(`[${organization}] SlotBookings report shows no inconsistencies to fix.`);
         if (!report.bookingsFixes) {
             const emptyFixes = { timestamp: new Date().toISOString(), deleted: {} };
             await checker.writeReport({ ...report, bookingsFixes: emptyFixes });
             functions.logger.info(`[${organization}] Marked SlotBookings report ${report.id} as checked (no fixes needed).`);
         }
        return { message: "No fixes needed based on the report." };
    }

    functions.logger.info(`[${organization}] Applying SlotBookings autofix based on report ${report.id}`);
    const bookingsFixes = await bookingsAutofix(db, organization, report);

    await checker.writeReport({ ...report, bookingsFixes });
    functions.logger.info(`[${organization}] Completed SlotBookings autofix and updated report ${report.id}`);

    return bookingsFixes;
  } catch (error) {
    functions.logger.error(`[${organization}] Error in _runSlotBookingsAutofixInternal:`, error);
    throw error; // Re-throw
  }
}


/**
 * Internal logic for running Booked Slots / Attendance autofix.
 * Gets/Generates the latest report and applies fixes.
 */
async function _runBookedSlotsAttendanceAutofixInternal(
  db: admin.firestore.Firestore,
  organization: string
): Promise<any> {
  functions.logger.info(`[${organization}] Starting _runBookedSlotsAttendanceAutofixInternal`);
  try {
    const checker = newSanityChecker(
      db,
      organization,
      SanityCheckKind.BookedSlotsAttendance
    );

    const report = await checker
      .getLatestReport()
      .then((r) => (!r || r.attendanceFixes ? checker.checkAndWrite() : r)); // Note: Uses 'attendanceFixes' field name

     if (!report) {
        functions.logger.warn(`[${organization}] No report found or generated for BookedSlotsAttendance autofix.`);
        return { message: "No report available to fix." };
    }

     // Check if fixes are needed
    if ((!report.strayAttendances || Object.keys(report.strayAttendances).length === 0) &&
        (!report.missingBookings || Object.keys(report.missingBookings).length === 0) &&
        (!report.mismatchedIntervals || Object.keys(report.mismatchedIntervals).length === 0)) {
        functions.logger.info(`[${organization}] BookedSlotsAttendance report shows no inconsistencies to fix.`);
         if (!report.attendanceFixes) { // Check the correct field name
             const emptyFixes = { timestamp: new Date().toISOString(), created: {}, updated: {}, deleted: {} }; // Adjust structure if needed
             await checker.writeReport({ ...report, attendanceFixes: emptyFixes });
             functions.logger.info(`[${organization}] Marked BookedSlotsAttendance report ${report.id} as checked (no fixes needed).`);
         }
        return { message: "No fixes needed based on the report." };
    }


    functions.logger.info(`[${organization}] Applying BookedSlotsAttendance autofix based on report ${report.id}`);
    const attendanceFixes = await bookedSlotsAttendanceAutofix(
      db,
      organization,
      report
    );

    // Write the original report back, now including the fixes applied
    await checker.writeReport({ ...report, attendanceFixes }); // Use correct field name
    functions.logger.info(`[${organization}] Completed BookedSlotsAttendance autofix and updated report ${report.id}`);

    return attendanceFixes;
  } catch (error) {
    functions.logger.error(`[${organization}] Error in _runBookedSlotsAttendanceAutofixInternal:`, error);
    throw error; // Re-throw
  }
}


// ==================================================================
// HTTPS Callable Functions (Wrappers around internal logic)
// ==================================================================

// Keep the CHECK functions as they are, they are not part of the scheduled task
// ... dbSlotAttendanceCheck, dbSlotSlotsByDayCheck, dbSlotBookingsCheck, dbBookedSlotsAttendanceCheck ...


export const dbSlotAttendanceAutofix = functions
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .https.onCall(
    wrapHttpsOnCallHandler(
      "dbSlotAttendanceAutofix", // Keep original name
      async ({ organization }: { organization: string }, { auth }) => {
        if (!(await checkIsAdmin(organization, auth))) throwUnauth();
        const db = admin.firestore();
        try {
            // Call the internal function
            return await _runSlotAttendanceAutofixInternal(db, organization);
        } catch (error) {
            functions.logger.error(`[${organization}] https dbSlotAttendanceAutofix failed:`, error);
            // throw new EisbukHttpsError("internal", "Slot/Attendance autofix failed.", error);
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
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
      "dbSlotSlotsByDayAutofix", // Keep original name
      async ({ organization }: { organization: string }, { auth }) => {
        if (!(await checkIsAdmin(organization, auth))) throwUnauth();
        const db = admin.firestore();
         try {
            // Call the internal function
            return await _runSlotSlotsByDayAutofixInternal(db, organization);
        } catch (error) {
            functions.logger.error(`[${organization}] https dbSlotSlotsByDayAutofix failed:`, error);
            // throw new EisbukHttpsError("internal", "Slot/SlotsByDay autofix failed.", error);
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
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
      "dbSlotBookingsAutofix", // Keep original name
      async ({ organization }: { organization: string }, { auth }) => {
        if (!(await checkIsAdmin(organization, auth))) throwUnauth();
        const db = admin.firestore();
        try {
            // Call the internal function
            return await _runSlotBookingsAutofixInternal(db, organization);
        } catch (error) {
            functions.logger.error(`[${organization}] https dbSlotBookingsAutofix failed:`, error);
            // throw new EisbukHttpsError("internal", "Slot/Bookings autofix failed.", error);
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
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
      "dbBookedSlotsAttendanceAutofix", // Keep original name
      async ({ organization }: { organization: string }, { auth }) => {
        if (!(await checkIsAdmin(organization, auth))) throwUnauth();
        const db = admin.firestore();
        try {
            // Call the internal function
            return await _runBookedSlotsAttendanceAutofixInternal(db, organization);
        } catch (error) {
            functions.logger.error(`[${organization}] https dbBookedSlotsAttendanceAutofix failed:`, error);
            // throw new EisbukHttpsError("internal", "Booked Slots/Attendance autofix failed.", error);
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
      }
    )
  );
