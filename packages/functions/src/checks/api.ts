import admin from "firebase-admin";

import { Collection, FirestoreSchema, SanityCheckKind } from "@eisbuk/shared";

import {
  findSlotAttendanceMismatches,
  findSlotBookingsMismatches,
} from "./slotAttendance";
import { findSlotSlotsByDayMismatches } from "./slotSlotsByDay";

type Firestore = admin.firestore.Firestore;

const getSanityChecksRef = (
  db: Firestore,
  organization: string,
  kind: SanityCheckKind
) => db.collection(Collection.SanityChecks).doc(organization).collection(kind);

const getLatestSanityCheck = async <K extends SanityCheckKind>(
  db: Firestore,
  organization: string,
  kind: K
): Promise<SanityCheckReport<K> | undefined> =>
  getSanityChecksRef(db, organization, kind)
    .orderBy("id", "asc")
    .limitToLast(1)
    .get()
    .then((snap) =>
      !snap.docs.length
        ? undefined
        : (snap.docs[0].data() as SanityCheckReport<K>)
    );

const writeSanityCheckReport = async <K extends SanityCheckKind>(
  db: Firestore,
  organization: string,
  kind: K,
  report: SanityCheckReport<K>
): Promise<SanityCheckReport<K>> => {
  await getSanityChecksRef(db, organization, kind).doc(report.id).set(report);
  return report;
};

interface SanityCheckerInterface<K extends SanityCheckKind> {
  check(): Promise<SanityCheckReport<K>>;
  writeReport: (report: SanityCheckReport<K>) => Promise<SanityCheckReport<K>>;
  checkAndWrite: () => Promise<SanityCheckReport<K>>;
  getLatestReport: () => Promise<SanityCheckReport<K> | undefined>;
}

export const newSanityChecker = <K extends SanityCheckKind>(
  db: Firestore,
  organization: string,
  kind: K
): SanityCheckerInterface<K> => {
  const getLatestReport = () => getLatestSanityCheck<K>(db, organization, kind);
  const writeReport = (report: SanityCheckReport<K>) =>
    writeSanityCheckReport(db, organization, kind, report);

  const check = (): Promise<SanityCheckReport<K>> => {
    const lookup: {
      [K in SanityCheckKind]: () => Promise<SanityCheckReport<K>>;
    } = {
      [SanityCheckKind.SlotAttendance]: () =>
        findSlotAttendanceMismatches(db, organization),
      [SanityCheckKind.SlotSlotsByDay]: () =>
        findSlotSlotsByDayMismatches(db, organization),
      [SanityCheckKind.SlotBookings]: () =>
        findSlotBookingsMismatches(db, organization),
    };

    return lookup[kind]();
  };
  const checkAndWrite = () => check().then(writeReport);

  return { getLatestReport, writeReport, check, checkAndWrite };
};

type SanityCheckReport<K extends SanityCheckKind> =
  FirestoreSchema["sanityChecks"][string][K];
