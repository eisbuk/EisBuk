import * as functions from "firebase-functions";
import admin from "firebase-admin";

import { __functionsZone__ } from "../constants";

import { checkUser, throwUnauth } from "../utils";

import {
  attendanceSlotMismatchAutofix,
  newSanityChecker,
} from "./slotRelatedDocs";
import { SanityCheckKind } from "@eisbuk/shared";

/**
 * Goes through all 'slotsByDay' entries, checks each date to see if there are no slots in the day and deletes the day if empty.
 * If all days are empty, deletes the entry (for a month) altogether.
 */
export const dbSlotAttendanceCheck = functions
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

export const dbSlotAttendanceAutofix = functions
  .region(__functionsZone__)
  .https.onCall(
    async ({ organization }: { organization: string }, { auth }) => {
      if (!(await checkUser(organization, auth))) throwUnauth();

      const db = admin.firestore();
      const checker = newSanityChecker(
        db,
        organization,
        SanityCheckKind.SlotAttendance
      );

      const latestReport = await checker.getLatestReport();
      const report = latestReport.attendanceFixes
        ? await checker.checkAndWrite()
        : latestReport;

      const attendanceFixes = await attendanceSlotMismatchAutofix(
        db,
        organization,
        report
      );
      checker.writeReport({ ...report, attendanceFixes });

      return attendanceFixes;
    }
  );
