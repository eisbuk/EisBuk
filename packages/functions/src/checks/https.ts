import * as functions from "firebase-functions";
import admin from "firebase-admin";

import { __functionsZone__ } from "../constants";

import { checkUser, throwUnauth } from "../utils";
import { findSlotAttendanceMismatches } from "./utils";

/**
 * Goes through all 'slotsByDay' entries, checks each date to see if there are no slots in the day and deletes the day if empty.
 * If all days are empty, deletes the entry (for a month) altogether.
 */
export const dbSanityCheck = functions
  .region(__functionsZone__)
  .https.onCall(
    async ({ organization }: { organization: string }, { auth }) => {
      if (!(await checkUser(organization, auth))) throwUnauth();

      const db = admin.firestore();

      const res = await findSlotAttendanceMismatches(db, organization);

      return res;
    }
  );
