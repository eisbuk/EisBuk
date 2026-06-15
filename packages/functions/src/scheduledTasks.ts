import * as functions from "firebase-functions";
import admin from "firebase-admin";

// Import ALL the internal helper functions created
import {
  _pruneSlotsByDayInternal,
  _deleteOrphanedBookingsInternal,
  _removeInvalidCustomerPhonesInternal,
  _clearDeletedCustomersRegistrationAndCategoriesInternal,
  _normalizeExistingEmailsInternal,
  _calculateBookingStatsThisAndNextMonthsInternal,
  // _populateDefaultEmailTemplatesInternal, // Excluded as it seems global/one-off
} from "./migrations";

import {
  _runSlotAttendanceAutofixInternal,
  _runSlotBookingsAutofixInternal,
  _runSlotSlotsByDayAutofixInternal,
  _runBookedSlotsAttendanceAutofixInternal,
} from "./checks/https.ts"; // Assuming internal funcs are in checks/https.ts

/**
 * ==================================
 * Daily Maintenance Scheduled Task
 * ==================================
 *
 * Purpose:
 * --------
 * Automatically runs essential database maintenance and autofix tasks
 * for specified organizations on a daily schedule. This replaces the need
 * to manually trigger these tasks via the debug page buttons.
 *
 * Trigger:
 * --------
 * Configured via Firebase/Cloud Scheduler using the `SCHEDULE` and `TIMEZONE`
 * constants defined below. Runs automatically based on that schedule.
 * To change the schedule, modify the constants and redeploy the function.
 *
 * Target Organizations:
 * -------------------
 * This function operates ONLY on the organization IDs listed in the
 * `MAINTENANCE_ORG_IDS` array below.
 * **TO ADD/REMOVE ORGANIZATIONS:** Modify the `MAINTENANCE_ORG_IDS` array
 * and redeploy the function.
 *
 * Tasks Performed:
 * ----------------
 * For each organization in the list, this function sequentially calls the
 * following internal maintenance routines:
 *   - _pruneSlotsByDayInternal: Removes empty day/month entries from slotsByDay.
 *   - _deleteOrphanedBookingsInternal: Deletes booking entries with no matching customer.
 *   - _removeInvalidCustomerPhonesInternal: Removes invalid phone numbers.
 *   - _clearDeletedCustomersRegistrationAndCategoriesInternal: Clears specific fields for deleted customers.
 *   - _normalizeExistingEmailsInternal: Normalizes customer email formats.
 *   - _calculateBookingStatsThisAndNextMonthsInternal: Recalculates booking stats.
 *   - _runSlotAttendanceAutofixInternal: Fixes inconsistencies between slots and attendance.
 *   - _runSlotBookingsAutofixInternal: Fixes inconsistencies between slots and bookings.
 *   - _runSlotSlotsByDayAutofixInternal: Fixes inconsistencies between slots and slotsByDay.
 *   - _runBookedSlotsAttendanceAutofixInternal: Fixes inconsistencies between booked slots and attendance.
 *
 * Monitoring:
 * -----------
 * Check the execution logs in the Google Cloud Console under "Cloud Functions".
 * Filter by the function name (e.g., "dailyMaintenance"). Look for start/end
 * messages, organization-specific logs, and any error messages.
 *
 * Manual Trigger (gcloud):
 * ------------------------
 * You can manually trigger a run outside the schedule using gcloud:
 * 1. Find the job name (usually 'firebase-schedule-dailyMaintenance-<region>') in Cloud Scheduler.
 * 2. Run: gcloud scheduler jobs run <your-scheduler-job-name> --location <your-region>
 *    Example: gcloud scheduler jobs run firebase-schedule-dailyMaintenance-europe-west6 --location europe-west6
 */

// --- Configuration ---
const SCHEDULE = 'every day 03:00'; // Set your desired schedule (e.g., 'every day 03:00')
const TIMEZONE = 'Europe/Berlin'; // Set your timezone: https://cloud.google.com/dataprep/docs/html/Supported-Time-Zone-Values_66194188
const MAINTENANCE_ORG_IDS: string[] = [
    "ORG_ID_1_REPLACE_ME", // <-- Replace with actual Organization ID
    "ORG_ID_2_REPLACE_ME", // <-- Add other Org IDs as needed
    // "ANOTHER_ORG_ID_REPLACE_ME",
];
// --- End Configuration ---


// Define the scheduled function
export const dailyMaintenance = functions.pubsub.schedule(SCHEDULE)
  .timeZone(TIMEZONE)
  .onRun(async (context) => {
    const db = admin.firestore();
    const timestamp = context.timestamp;
    functions.logger.info(`Starting daily maintenance run triggered at ${timestamp}`);
    functions.logger.info(`Target organizations: ${MAINTENANCE_ORG_IDS.join(', ')}`);

    if (!MAINTENANCE_ORG_IDS || MAINTENANCE_ORG_IDS.length === 0 || MAINTENANCE_ORG_IDS[0].includes("REPLACE_ME")) {
        functions.logger.warn("MAINTENANCE_ORG_IDS array is empty or contains placeholder IDs. Skipping run. Please configure the array in scheduledTasks.ts");
        return null;
    }

    let successCount = 0;
    let errorCount = 0;

    // Process each organization sequentially
    for (const orgId of MAINTENANCE_ORG_IDS) {
        functions.logger.info(`--- Running maintenance for organization: ${orgId} ---`);
        try {
            // --- Migration/Cleanup Tasks ---
            await _pruneSlotsByDayInternal(db, orgId);
            await _deleteOrphanedBookingsInternal(db, orgId);
            await _removeInvalidCustomerPhonesInternal(db, orgId);
            await _clearDeletedCustomersRegistrationAndCategoriesInternal(db, orgId);
            await _normalizeExistingEmailsInternal(db, orgId);
            await _calculateBookingStatsThisAndNextMonthsInternal(db, orgId);

            // --- Autofix Tasks ---
            await _runSlotAttendanceAutofixInternal(db, orgId);
            await _runSlotBookingsAutofixInternal(db, orgId);
            await _runSlotSlotsByDayAutofixInternal(db, orgId);
            await _runBookedSlotsAttendanceAutofixInternal(db, orgId);

            functions.logger.info(`--- Successfully completed maintenance for organization: ${orgId} ---`);
            successCount++;

        } catch (error) {
            // Log the error but continue to the next organization
            errorCount++;
            functions.logger.error(`!!! Error during maintenance for organization ${orgId}:`, error);
            // Optionally, send an alert on error (e.g., via another function or service)
        }
    }

    functions.logger.info(`Daily maintenance run finished. Processed ${successCount} organizations successfully, ${errorCount} encountered errors.`);
    return null; // Indicate success to Pub/Sub scheduler
  });
