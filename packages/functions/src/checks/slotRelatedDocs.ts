import admin from "firebase-admin";

import {
  AttendanceAutofixReport,
  Collection,
  DateMismatchDoc,
  FirestoreSchema,
  OrgSubCollection,
  SanityCheckKind,
  SlotAttendanceUpdate,
  SlotAttendnace,
  SlotInterface,
  SlotSanityCheckReport,
  UnpairedDoc,
  map,
  wrapIter,
} from "@eisbuk/shared";
import { DateTime } from "luxon";

type Firestore = admin.firestore.Firestore;

const relevantCollections = [
  OrgSubCollection.Attendance,
  OrgSubCollection.Slots,
] as const;

type RelevantCollection = (typeof relevantCollections)[number];

interface EntryExistsPayload {
  collection: RelevantCollection;
  exists: boolean;
}

interface UnpairedCheckPayload {
  id: string;
  entries: EntryExistsPayload[];
}

interface EntryDatePayload extends EntryExistsPayload {
  date: string | undefined;
}

interface DateCheckPayload {
  id: string;
  entries: EntryDatePayload[];
}

/**
 * A util used by slot related check cloud function used to find mismatch between slot and attendance entries.
 */
export const findSlotAttendanceMismatches = async (
  db: Firestore,
  organization: string
): Promise<SlotSanityCheckReport> => {
  const timestamp = DateTime.now().toISO();

  const orgRef = db.collection(Collection.Organizations).doc(organization);

  const slots = await orgRef
    .collection(OrgSubCollection.Slots)
    .get()
    .then((snap) => snap.docs);
  const attendances = await orgRef
    .collection(OrgSubCollection.Attendance)
    .get()
    .then((snap) => snap.docs);

  const collections = {
    [OrgSubCollection.Slots]: new Map<string, SlotInterface>(
      map(slots, (doc) => [doc.id, doc.data() as SlotInterface])
    ),
    [OrgSubCollection.Attendance]: new Map<string, SlotAttendnace>(
      map(attendances, (doc) => [doc.id, doc.data() as SlotAttendnace])
    ),
  };

  const ids = new Set([
    ...slots.map((doc) => doc.id),
    ...attendances.map((doc) => doc.id),
  ]);

  const normalisedEntries = wrapIter(ids).map((id) => ({
    id,
    entries: relevantCollections.map((collection) => {
      const entry = collections[collection].get(id);
      return {
        collection,
        exists: Boolean(entry),
        date: entry?.date,
      };
    }),
  }));

  const unpairedEntries = normalisedEntries._reduce(collectUnpairedDocs, {});
  const dateMismatches = normalisedEntries._reduce(dateMismatchReducer, {});

  return { id: timestamp, unpairedEntries, dateMismatches };
};

const collectUnpairedDocs = (
  rec: Record<string, UnpairedDoc>,
  { id, entries }: UnpairedCheckPayload
): Record<string, UnpairedDoc> => {
  // If all entries exist, skip the doc
  if (entries.every(({ exists }) => exists)) return rec;

  const unpairedDoc = wrapIter(entries)
    .map(({ collection, exists }) => ({
      collection,
      list: exists ? "existing" : "missing",
    }))
    ._reduce(
      (acc, { collection, list }) => ({
        ...acc,
        [list]: [...acc[list], collection],
      }),
      { existing: [], missing: [] }
    );

  return { ...rec, [id]: unpairedDoc };
};

const dateMismatchReducer = (
  rec: Record<string, DateMismatchDoc>,
  { id, entries: e }: DateCheckPayload
): Record<string, DateMismatchDoc> => {
  const entries = e.filter(({ exists }) => exists);
  // Keep the first date as reference point
  const dateRef = entries[0].date;
  // If dates for all existing entries are the same, skip the doc
  return entries.every(({ date }) => date === dateRef)
    ? rec
    : // If there's a date mismatch, create a [collection]: date record for the doc
      {
        ...rec,
        [id]: Object.fromEntries(
          entries.map(({ collection, date }) => [collection, date] as const)
        ) as DateMismatchDoc,
      };
};

export const attendanceSlotMismatchAutofix = async (
  db: Firestore,
  organization: string,
  mismatches: SlotSanityCheckReport
): Promise<AttendanceAutofixReport> => {
  const batch = db.batch();

  const { unpairedEntries, dateMismatches } = mismatches;

  const orgRef = db.collection(Collection.Organizations).doc(organization);
  const slots = orgRef.collection(OrgSubCollection.Slots);
  const attendance = orgRef.collection(OrgSubCollection.Attendance);

  const attendanceFromSlot = ({ date }: SlotInterface): SlotAttendnace => ({
    date,
    attendances: {},
  });

  const created = {} as Record<string, SlotAttendnace>;
  const deleted = {} as Record<string, SlotAttendnace>;
  const updated = {} as Record<string, SlotAttendanceUpdate>;

  // Create attendance entry for every slot entry without one
  await Promise.all(
    Object.entries(unpairedEntries).map(async ([id, { existing, missing }]) => {
      // At this point there can only be two mismatch variants:
      // - slot and no attendance
      // - attendance and no slot
      //
      // TODO: update this when the check situation changes
      switch (true) {
        case existing.includes(OrgSubCollection.Slots) &&
          missing.includes(OrgSubCollection.Attendance):
          const slotRef = await slots.doc(id).get();
          const slotData = slotRef.data() as SlotInterface;
          const attendanceDoc = attendanceFromSlot(slotData);
          batch.set(attendance.doc(id), attendanceDoc, { merge: true });

          // Save the created data for report
          created[id] = attendanceDoc;
          break;

        case existing.includes(OrgSubCollection.Attendance) &&
          missing.includes(OrgSubCollection.Slots):
          const toDelete = attendance.doc(id);

          batch.delete(toDelete);

          // Save the existing data before deletion (before batch.commit) and store for report
          deleted[id] = await toDelete
            .get()
            .then((snap) => snap.data() as SlotAttendnace);
          break;

        default:
          throw new Error(
            "Found part of code that should be unreachable: slot attendance mismatches"
          );
      }
    })
  );

  // Update mismatched dates so that attendance has the same date as the corresponding slot
  await Promise.all(
    Object.entries(dateMismatches).map(async ([id, { slots: date }]) => {
      const toUpdate = attendance.doc(id);
      batch.set(attendance.doc(id), { date }, { merge: true });

      // Save the update for report
      const before = await toUpdate
        .get()
        .then((snap) => snap.data() as SlotAttendnace)
        .then(({ date }) => date);
      updated[id] = {
        date: { before, after: date },
      };
    })
  );

  await batch.commit();

  return {
    timestamp: DateTime.now().toISO(),
    created,
    deleted,
    updated,
  };
};

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

  const check = (): Promise<SanityCheckReport<K>> =>
    ({
      [SanityCheckKind.SlotAttendance]: findSlotAttendanceMismatches(
        db,
        organization
      ),
    }[kind]);

  const checkAndWrite = () => check().then(writeReport);

  return { getLatestReport, writeReport, check, checkAndWrite };
};

type SanityCheckReport<K extends SanityCheckKind> =
  FirestoreSchema["sanityChecks"][string][K];
