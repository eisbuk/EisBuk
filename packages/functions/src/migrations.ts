import * as functions from "firebase-functions";
import { FieldValue } from "@google-cloud/firestore";
import admin from "firebase-admin";
import { DateTime } from "luxon";

import {
  Collection,
  OrgSubCollection,
  defaultEmailTemplates,
  OrganizationData,
  CustomerFull,
  isValidPhoneNumber,
  CustomerBookingEntry,
  BookingSubCollection,
  SlotsByDay,
  normalizeEmail,
} from "@eisbuk/shared";

import { __functionsZone__ } from "./constants";
import { wrapHttpsOnCallHandler } from "./sentry-serverless-firebase";

import { checkIsAdmin, getCustomerStats, throwUnauth, EisbukHttpsError } from "./utils";


// ==================================================================
// Internal Logic Functions (called by https and scheduled tasks)
// ==================================================================

/**
 * Internal logic for pruneSlotsByDay.
 * Goes through all 'slotsByDay' entries for an organization, checks each date
 * to see if there are no slots in the day and deletes the day if empty.
 * If all days are empty, deletes the entry (for a month) altogether.
 */
async function _pruneSlotsByDayInternal(
  db: admin.firestore.Firestore,
  organization: string
): Promise<{ success: boolean }> {
  functions.logger.info(`[${organization}] Starting pruneSlotsByDayInternal`);
  try {
    const batch = db.batch();
    const slotsByDayRef = db
      .collection(Collection.Organizations)
      .doc(organization)
      .collection(OrgSubCollection.SlotsByDay);

    const slotsByDaySnap = await slotsByDayRef.get();

    if (slotsByDaySnap.empty) {
      functions.logger.info(`[${organization}] No slotsByDay entries found for pruning.`);
      return { success: true };
    }

    let monthsProcessed = 0;
    let daysPruned = 0;
    let monthsDeleted = 0;

    slotsByDaySnap.forEach((monthSnapshot) => {
      monthsProcessed++;
      const monthRef = slotsByDayRef.doc(monthSnapshot.id);
      const monthEntry = monthSnapshot.data();
      const dates = Object.keys(monthEntry);
      let nonEmptySlots = dates.length;
      const updatedRecord: { [key: string]: any } = {}; // Use 'any' for FieldValue.delete()

      dates.forEach((date) => {
        const dayEntry = monthEntry[date];
        // Check if dayEntry is an object and has no keys (is empty)
        if (typeof dayEntry === 'object' && dayEntry !== null && Object.keys(dayEntry).length === 0) {
          nonEmptySlots--;
          updatedRecord[date] = FieldValue.delete();
          daysPruned++;
        } else {
          // Keep non-empty days or non-object values
          updatedRecord[date] = dayEntry;
        }
      });

      // Determine action based on whether any days were pruned or if the whole month is empty
      if (nonEmptySlots < dates.length && nonEmptySlots > 0) {
        // Some days were pruned, update the month doc by removing empty days
        // Using update is safer than set+merge when dealing with FieldValue.delete()
        batch.update(monthRef, updatedRecord);
      } else if (nonEmptySlots === 0 && dates.length > 0) {
        // All days were empty (or became empty), delete the entire month doc
        batch.delete(monthRef);
        monthsDeleted++;
      }
      // If nonEmptySlots === dates.length, do nothing (no changes needed for this month)
    });

    if (daysPruned > 0 || monthsDeleted > 0) {
      await batch.commit();
      functions.logger.info(`[${organization}] Pruned slotsByDay: Committed changes. ${daysPruned} empty days pruned across ${monthsProcessed} months. ${monthsDeleted} empty months deleted.`);
    } else {
       functions.logger.info(`[${organization}] Pruned slotsByDay: No changes needed across ${monthsProcessed} months.`);
    }

    return { success: true };
  } catch (error) {
    functions.logger.error(`[${organization}] Error in pruneSlotsByDayInternal:`, error);
    // Re-throw or handle as needed; for scheduled tasks, logging might be sufficient.
    // For https calls, the wrapper will handle returning an error.
    throw error; // Re-throw to be caught by the https wrapper or scheduled task handler
  }
}


/**
 * Internal logic for deleteOrphanedBookings.
 * Deletes booking entries without corresponding customers for an organization.
 */
async function _deleteOrphanedBookingsInternal(
  db: admin.firestore.Firestore,
  organization: string
): Promise<{ success: boolean; deletedCount: number }> {
  functions.logger.info(`[${organization}] Starting deleteOrphanedBookingsInternal`);
  try {
    const orgRef = db.collection(Collection.Organizations).doc(organization);

    // get all customer IDs
    const allCustomersSnap = await orgRef
      .collection(OrgSubCollection.Customers)
      .select() // Select no fields, just get IDs
      .get();
    const customerIds = new Set(allCustomersSnap.docs.map(({ id }) => id));
    functions.logger.info(`[${organization}] Found ${customerIds.size} customer IDs.`);

    const bookingsRef = orgRef.collection(OrgSubCollection.Bookings);
    const allBookingsSnap = await bookingsRef.get();

    if (allBookingsSnap.empty) {
        functions.logger.info(`[${organization}] No bookings found to check for orphans.`);
        return { success: true, deletedCount: 0 };
    }

    const batch = db.batch();
    let deletedCount = 0;

    allBookingsSnap.forEach((doc) => {
      // The customer ID is the document ID in the Bookings collection
      const customerId = doc.id;
      // Check if this booking's customer ID exists in our set of customer IDs
      if (!customerIds.has(customerId)) {
        functions.logger.warn(`[${organization}] Found orphaned booking for non-existent customer ID: ${customerId}. Deleting.`);
        batch.delete(doc.ref);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      await batch.commit();
      functions.logger.info(`[${organization}] Deleted ${deletedCount} orphaned bookings.`);
    } else {
      functions.logger.info(`[${organization}] No orphaned bookings found to delete.`);
    }

    return { success: true, deletedCount };
  } catch (error) {
    functions.logger.error(`[${organization}] Error in deleteOrphanedBookingsInternal:`, error);
    throw error; // Re-throw
  }
}

/**
 * Internal logic for populateDefaultEmailTemplates.
 * NOTE: This function operates globally or on specific orgs based on input,
 * but the original https function iterates all orgs.
 * Consider if this should be part of a *per-org* daily task.
 * For now, keeping the global iteration logic, but it won't be called
 * by the per-org scheduled task unless adapted.
 */
async function _populateDefaultEmailTemplatesInternal(
  db: admin.firestore.Firestore,
  targetOrganization?: string // Optional: If provided, only run for this org
): Promise<{ success: boolean; updatedOrgs: string[] }> {
  functions.logger.info(`Starting populateDefaultEmailTemplatesInternal${targetOrganization ? ` for org: ${targetOrganization}` : ' globally'}`);
  try {
    const batch = db.batch();
    const updatedOrgs: string[] = [];

    const orgsQuery = targetOrganization
      ? db.collection(Collection.Organizations).doc(targetOrganization).get()
      : db.collection(Collection.Organizations).get();

    const orgsSnap = await orgsQuery;
    const orgDocs = targetOrganization ? (orgsSnap.exists ? [orgsSnap as admin.firestore.DocumentSnapshot<OrganizationData>] : []) : (orgsSnap as admin.firestore.QuerySnapshot<OrganizationData>).docs;


    if (!orgDocs.length) {
        functions.logger.info("No organizations found to process for email templates.");
        return { success: true, updatedOrgs: [] };
    }

    orgDocs.forEach((organizationDoc) => {
      const data = organizationDoc.data();
      if (!data) return; // Should not happen, but safeguard

      // templates already exist or are non-empty array => return
      if (data.emailTemplates && Array.isArray(data.emailTemplates) && data.emailTemplates.length > 0) {
        return;
      }

      functions.logger.info(`[${organizationDoc.id}] Populating default email templates for organization: ${data.displayName || organizationDoc.id}`);
      updatedOrgs.push(organizationDoc.id);

      // Use update to only add the field if it doesn't exist or merge if needed
      batch.update(organizationDoc.ref, {
        emailTemplates: defaultEmailTemplates,
      });
    });

    if (updatedOrgs.length > 0) {
      await batch.commit();
      functions.logger.info(`Committed default email templates for ${updatedOrgs.length} organizations: ${updatedOrgs.join(', ')}`);
    } else {
       functions.logger.info("No organizations required email template population.");
    }


    return { success: true, updatedOrgs };
  } catch (error) {
    functions.logger.error(`Error in populateDefaultEmailTemplatesInternal${targetOrganization ? ` for org: ${targetOrganization}` : ''}:`, error);
    throw error; // Re-throw
  }
}


/**
 * Internal logic for removeInvalidCustomerPhones.
 * Removes phone numbers that are not valid according to isValidPhoneNumber check.
 */
async function _removeInvalidCustomerPhonesInternal(
  db: admin.firestore.Firestore,
  organization: string
): Promise<{ success: boolean; updatedCount: number }> {
  functions.logger.info(`[${organization}] Starting removeInvalidCustomerPhonesInternal`);
  try {
    const batch = db.batch();
    let updatedCount = 0;

    const customersSnap = await db
      .collection(Collection.Organizations)
      .doc(organization)
      .collection(OrgSubCollection.Customers)
      .get();

    if (customersSnap.empty) {
        functions.logger.info(`[${organization}] No customers found to check phone numbers.`);
        return { success: true, updatedCount: 0 };
    }

    customersSnap.forEach((customer) => {
      const data = customer.data() as CustomerFull;
      // Skip if phone is missing, null, or empty string
      if (!data.phone) return;

      const { phone } = data;

      if (!isValidPhoneNumber(phone)) {
        functions.logger.warn(`[${organization}] Customer ${customer.id} has invalid phone number "${phone}". Removing.`);
        batch.update(customer.ref, { phone: FieldValue.delete() });
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
      functions.logger.info(`[${organization}] Removed invalid phone numbers for ${updatedCount} customers.`);
    } else {
      functions.logger.info(`[${organization}] No invalid customer phone numbers found.`);
    }

    return { success: true, updatedCount };
  } catch (error) {
    functions.logger.error(`[${organization}] Error in removeInvalidCustomerPhonesInternal:`, error);
    throw error; // Re-throw
  }
}


/**
 * Internal logic for clearDeletedCustomersRegistrationAndCategories.
 * Clears registrationCode and categories for customers marked as deleted.
 */
async function _clearDeletedCustomersRegistrationAndCategoriesInternal(
  db: admin.firestore.Firestore,
  organization: string
): Promise<{ success: boolean; updatedCount: number }> {
  functions.logger.info(`[${organization}] Starting clearDeletedCustomersRegistrationAndCategoriesInternal`);
  try {
    const batch = db.batch();
    let updatedCount = 0;

    const deletedCustomersSnap = await db
      .collection(Collection.Organizations)
      .doc(organization)
      .collection(OrgSubCollection.Customers)
      .where("deleted", "==", true)
      .get();

    if (deletedCustomersSnap.empty) {
        functions.logger.info(`[${organization}] No deleted customers found to clear fields.`);
        return { success: true, updatedCount: 0 };
    }

    deletedCustomersSnap.forEach((doc) => {
      functions.logger.info(`[${organization}] Clearing registrationCode and categories for deleted customer ${doc.id}.`);
      batch.update(doc.ref, {
        registrationCode: "", // Set to empty string
        categories: [],       // Set to empty array
      });
      updatedCount++;
    });

    if (updatedCount > 0) {
      await batch.commit();
      functions.logger.info(`[${organization}] Cleared fields for ${updatedCount} deleted customers.`);
    } else {
      // This case should technically not be reached if the query returned docs, but included for completeness
       functions.logger.info(`[${organization}] No deleted customers required field clearing (unexpected).`);
    }


    return { success: true, updatedCount };
  } catch (error) {
    functions.logger.error(`[${organization}] Error in clearDeletedCustomersRegistrationAndCategoriesInternal:`, error);
    throw error; // Re-throw
  }
}


/**
 * Internal logic for calculateBookingStatsThisAndNextMonths.
 * Calculates booking stats for the current and next month for all customers in an org.
 */
async function _calculateBookingStatsThisAndNextMonthsInternal(
  db: admin.firestore.Firestore,
  organization: string
): Promise<{ success: boolean; processedCustomers: number }> {
  functions.logger.info(`[${organization}] Starting calculateBookingStatsThisAndNextMonthsInternal`);
  try {
    const orgRef = db.collection(Collection.Organizations).doc(organization);

    // Get current and next months strings
    const now = DateTime.now(); // Use consistent 'now'
    const currentMonthStr = now.toISODate()?.substring(0, 7);
    const nextMonthStr = now.plus({ months: 1 }).toISODate()?.substring(0, 7);

    if (!currentMonthStr || !nextMonthStr) {
        throw new Error("Could not determine current or next month string.");
    }

    functions.logger.info(`[${organization}] Calculating stats for months: ${currentMonthStr}, ${nextMonthStr}`);

    // Fetch slots for both months concurrently
    const [currentMonthSlotsSnap, nextMonthSlotsSnap] = await Promise.all([
        orgRef.collection(OrgSubCollection.SlotsByDay).doc(currentMonthStr).get(),
        orgRef.collection(OrgSubCollection.SlotsByDay).doc(nextMonthStr).get()
    ]);

    const currentMonthSlots = (currentMonthSlotsSnap.data() as SlotsByDay) || {};
    const nextMonthSlots = (nextMonthSlotsSnap.data() as SlotsByDay) || {};

    const allBookingsSnap = await orgRef.collection(OrgSubCollection.Bookings).get();

    if (allBookingsSnap.empty) {
        functions.logger.info(`[${organization}] No bookings found, skipping stats calculation.`);
        return { success: true, processedCustomers: 0 };
    }

    const batch = db.batch();
    let processedCustomers = 0;

    // Process bookings sequentially or in limited parallel batches if many customers
    for (const bookingDoc of allBookingsSnap.docs) {
        const customerId = bookingDoc.id;
        const customerRef = orgRef.collection(OrgSubCollection.Customers).doc(customerId);

        try {
            const bookedSlotsSnapshot = await bookingDoc.ref
                .collection(BookingSubCollection.BookedSlots)
                .get();

            // Skip if customer has no booked slots subcollection or it's empty
            if (bookedSlotsSnapshot.empty) {
                // Optionally clear stats if they exist but there are no bookings
                 // batch.update(customerRef, { bookingStats: FieldValue.delete() });
                continue;
            }

            const bookedSlots: { [slotId: string]: CustomerBookingEntry } = {};
            bookedSlotsSnapshot.forEach((doc) => {
                bookedSlots[doc.id] = doc.data() as CustomerBookingEntry;
            });

            const thisMonthStats = getCustomerStats(
                bookedSlots,
                currentMonthSlots,
                currentMonthStr
            );
            const nextMonthStats = getCustomerStats(
                bookedSlots,
                nextMonthSlots,
                nextMonthStr
            );

            // Merge stats for both months. Ensure keys don't overlap unexpectedly if logic changes.
            const mergedStats = { ...thisMonthStats, ...nextMonthStats };

            // Update the customer document with the calculated stats
            batch.update(customerRef, { bookingStats: mergedStats });
            processedCustomers++;
            functions.logger.debug(`[${organization}] Calculated stats for customer ${customerId}.`);

        } catch (custError) {
            functions.logger.error(`[${organization}] Error processing stats for customer ${customerId}:`, custError);
            // Decide whether to continue or stop the whole process on single customer error
            // continue; // Example: Skip this customer and continue with others
        }
    }

    if (processedCustomers > 0) {
        await batch.commit();
        functions.logger.info(`[${organization}] Committed booking stats for ${processedCustomers} customers.`);
    } else {
        functions.logger.info(`[${organization}] No customer stats were updated.`);
    }


    return { success: true, processedCustomers };
  } catch (error) {
    functions.logger.error(`[${organization}] Error in calculateBookingStatsThisAndNextMonthsInternal:`, error);
    throw error; // Re-throw
  }
}


/**
 * Internal logic for normalizeExistingEmails.
 * Normalizes email addresses for all customers in an organization.
 */
async function _normalizeExistingEmailsInternal(
  db: admin.firestore.Firestore,
  organization: string
): Promise<{ success: boolean; updatedCount: number }> {
  functions.logger.info(`[${organization}] Starting normalizeExistingEmailsInternal`);
  try {
    const batch = db.batch();
    let updatedCount = 0;

    const customersSnap = await db
      .collection(Collection.Organizations)
      .doc(organization)
      .collection(OrgSubCollection.Customers)
      .get();

     if (customersSnap.empty) {
        functions.logger.info(`[${organization}] No customers found to normalize emails.`);
        return { success: true, updatedCount: 0 };
    }

    customersSnap.forEach((customer) => {
      const data = customer.data() as CustomerFull;
      // Skip if email is missing, null, or empty string
      if (!data.email) return;

      const { email } = data;
      const emailNormalized = normalizeEmail(email); // Use normalizeEmail from shared

      if (email !== emailNormalized) {
        functions.logger.info(`[${organization}] Normalizing email for customer ${customer.id}: "${email}" -> "${emailNormalized}"`);
        batch.update(customer.ref, { email: emailNormalized });
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
      functions.logger.info(`[${organization}] Normalized emails for ${updatedCount} customers.`);
    } else {
      functions.logger.info(`[${organization}] No customer emails required normalization.`);
    }

    return { success: true, updatedCount };
  } catch (error) {
    functions.logger.error(`[${organization}] Error in normalizeExistingEmailsInternal:`, error);
    throw error; // Re-throw
  }
}


// ==================================================================
// HTTPS Callable Functions (Wrappers around internal logic)
// ==================================================================

/**
 * Goes through all 'slotsByDay' entries, checks each date to see if there are no slots in the day and deletes the day if empty.
 * If all days are empty, deletes the entry (for a month) altogether.
 */
export const pruneSlotsByDay = functions
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .https.onCall(
    wrapHttpsOnCallHandler(
      "pruneSlotsByDay", // Keep the original name for client compatibility
      async ({ organization }: { organization: string }, { auth }) => {
        if (!(await checkIsAdmin(organization, auth))) throwUnauth();
        const db = admin.firestore();
        // Call the internal function
        try {
            return await _pruneSlotsByDayInternal(db, organization);
        } catch (error) {
            // Log the error and return a standard failure response for https calls
            functions.logger.error(`[${organization}] https pruneSlotsByDay failed:`, error);
            // Optionally re-throw as HttpsError or return a structured error
            // throw new EisbukHttpsError("internal", "Prune slots by day failed.", error);
             return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
      }
    )
  );

/**
 * Deletes old bookings without corresponding customers
 */
export const deleteOrphanedBookings = functions
  .runWith({
    memory: "512MB",
  })
  .region("europe-west6")
  .https.onCall(
    wrapHttpsOnCallHandler(
      "deleteOrphanedBookings", // Keep the original name
      async ({ organization }: { organization: string }, { auth }) => {
        if (!(await checkIsAdmin(organization, auth))) throwUnauth();
        const db = admin.firestore();
        try {
            // Call the internal function
            return await _deleteOrphanedBookingsInternal(db, organization);
        } catch (error) {
            functions.logger.error(`[${organization}] https deleteOrphanedBookings failed:`, error);
            // throw new EisbukHttpsError("internal", "Delete orphaned bookings failed.", error);
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
      }
    )
  );

export const populateDefaultEmailTemplates = functions
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .https.onCall(
    wrapHttpsOnCallHandler(
      "populateDefaultEmailTemplates", // Keep the original name
      async ({ organization }: { organization: string }, { auth }) => {
        // This function originally iterated all orgs, ignoring the input 'organization' param
        // The internal function can now optionally target a specific org.
        // The https function should probably retain the global behavior for admin calls.
        // However, the admin check was based on the *input* organization, which is inconsistent.
        // Re-evaluating: Let's make the HTTPS call target the *specific* org provided, matching the admin check.
        // If a global population is needed, a separate mechanism/function might be better.

        if (!(await checkIsAdmin(organization, auth))) throwUnauth();
        const db = admin.firestore();
        try {
            // Call the internal function for the specific organization
            return await _populateDefaultEmailTemplatesInternal(db, organization);
        } catch (error) {
            functions.logger.error(`[${organization}] https populateDefaultEmailTemplates failed:`, error);
            // throw new EisbukHttpsError("internal", "Populate default email templates failed.", error);
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
      }
    )
  );

export const removeInvalidCustomerPhones = functions
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .https.onCall(
    wrapHttpsOnCallHandler(
      "removeInvalidCustomerPhones", // Keep the original name
      async ({ organization }: { organization: string }, { auth }) => {
        if (!(await checkIsAdmin(organization, auth))) throwUnauth();
        const db = admin.firestore();
        try {
            // Call the internal function
            return await _removeInvalidCustomerPhonesInternal(db, organization);
        } catch (error) {
            functions.logger.error(`[${organization}] https removeInvalidCustomerPhones failed:`, error);
            // throw new EisbukHttpsError("internal", "Remove invalid customer phones failed.", error);
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
      }
    )
  );

export const clearDeletedCustomersRegistrationAndCategories = functions
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .https.onCall(
    wrapHttpsOnCallHandler(
      "clearDeletedCustomersRegistrationAndCategories", // Keep the original name
      async ({ organization }: { organization: string }, { auth }) => {
        if (!(await checkIsAdmin(organization, auth))) throwUnauth();
        const db = admin.firestore();
        try {
            // Call the internal function
            return await _clearDeletedCustomersRegistrationAndCategoriesInternal(db, organization);
        } catch (error) {
            functions.logger.error(`[${organization}] https clearDeletedCustomersRegistrationAndCategories failed:`, error);
            // throw new EisbukHttpsError("internal", "Clear deleted customers fields failed.", error);
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
      }
    )
  );

export const calculateBookingStatsThisAndNextMonths = functions
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .https.onCall(
    wrapHttpsOnCallHandler(
      "calculateBookingStatsThisAndNextMonths", // Keep the original name
      async ({ organization }: { organization: string }, { auth }) => {
        if (!(await checkIsAdmin(organization, auth))) throwUnauth();
        const db = admin.firestore();
        try {
            // Call the internal function
            return await _calculateBookingStatsThisAndNextMonthsInternal(db, organization);
        } catch (error) {
            functions.logger.error(`[${organization}] https calculateBookingStatsThisAndNextMonths failed:`, error);
            // throw new EisbukHttpsError("internal", "Calculate booking stats failed.", error);
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
      }
    )
  );
export const normalizeExistingEmails = functions
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .https.onCall(
    wrapHttpsOnCallHandler(
      "normalizeExistingEmails", // Keep the original name
      async ({ organization }: { organization: string }, { auth }) => {
        if (!(await checkIsAdmin(organization, auth))) throwUnauth();
        const db = admin.firestore();
        try {
            // Call the internal function
            return await _normalizeExistingEmailsInternal(db, organization);
        } catch (error) {
            functions.logger.error(`[${organization}] https normalizeExistingEmails failed:`, error);
            // throw new EisbukHttpsError("internal", "Normalize existing emails failed.", error);
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
      }
    )
  );
