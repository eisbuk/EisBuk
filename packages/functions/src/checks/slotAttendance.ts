import { DateTime } from "luxon";
import admin from "firebase-admin";

import {
  SlotAttendanceAutofixReport,
  SlotBookingsAutofixReport,
  BookingSubCollection,
  Collection,
  CustomerBookingEntry,
  OrgSubCollection,
  SlotAttendanceUpdate,
  SlotAttendnace,
  SlotInterface,
  SlotAttendanceSanityCheckReport,
  map,
  DateMismatchDoc,
  UnpairedDoc,
  wrapIter,
  SlotBookingsSanityCheckReport,
} from "@eisbuk/shared";

import { syncSlotAttendance } from "../slotSync";

type Firestore = admin.firestore.Firestore;

const relevantCollections = [
  OrgSubCollection.Attendance,
  OrgSubCollection.Slots,
] as const;

/**
 * A util used by slot related check cloud function used to find mismatch between slot and attendance entries.
 */
export const findSlotAttendanceMismatches = async (
  db: Firestore,
  organization: string
): Promise<SlotAttendanceSanityCheckReport> => {
  const timestamp = DateTime.now().toISO();

  // We're only checking for slots/attendances in the last 3 months
  // This will actually be between 3 and 4 months to start from the beginning of the T-3 month and include the partial final month (up until today)
  const startDate = DateTime.now()
    .minus({ months: 3 })
    .startOf("month")
    .toISODate();

  const [slots, attendances] = await Promise.all(
    [OrgSubCollection.Slots, OrgSubCollection.Attendance].map((collName) =>
      db
        .collection(Collection.Organizations)
        .doc(organization)
        .collection(collName)
        .where("date", ">", startDate)
        .orderBy("date", "asc")
        .get()
        .then((snap) => snap.docs)
    )
  );

  const collections = {
    [OrgSubCollection.Slots]: new Map<string, SlotInterface>(
      map(slots, (doc) => [doc.id, doc.data() as SlotInterface])
    ),
    [OrgSubCollection.Attendance]: new Map<string, SlotAttendnace>(
      map(attendances, (doc) => [doc.id, doc.data() as SlotAttendnace])
    ),
  };

  // Create a set of all available ids (in both collections)
  // set = witout duplicates
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

export const attendanceSlotMismatchAutofix = async (
  db: Firestore,
  organization: string,
  mismatches: SlotAttendanceSanityCheckReport
): Promise<SlotAttendanceAutofixReport> => {
  const ids = new Set([
    ...Object.keys(mismatches.unpairedEntries),
    ...Object.keys(mismatches.dateMismatches),
  ]);
  const results = await Promise.all(
    [...ids].map(async (id) => ({
      id,
      ...(await syncSlotAttendance(db, organization, id)),
    }))
  );
  const created: Record<string, SlotAttendnace> = {};
  const deleted: Record<string, SlotAttendnace> = {};
  const updated: Record<string, SlotAttendanceUpdate> = {};
  results.forEach(({ id, before, after }) => {
    if (!before && after) created[id] = after;
    else if (before && !after) deleted[id] = before;
    else if (before && after && before.date !== after.date) {
      updated[id] = { date: { before: before.date, after: after.date } };
    }
  });
  return { timestamp: DateTime.now().toISO(), created, deleted, updated };
};

export const bookingsAutofix = async (
  db: Firestore,
  organization: string,
  mismatches: SlotBookingsSanityCheckReport
): Promise<SlotBookingsAutofixReport> => {
  const batch = db.batch();

  const { strayBookings, dateMismatches, invalidIntervalBookings } = mismatches;
  const allMismatches = {
    ...strayBookings,
    ...dateMismatches,
    ...invalidIntervalBookings,
  };

  const orgRef = db.collection(Collection.Organizations).doc(organization);
  const deleted = {} as Record<string, CustomerBookingEntry>;

  await Promise.all(
    Object.entries(allMismatches).map(async ([fullId]) => {
      const [slotId, secretKey] = fullId.split("--");

      const toDelete = orgRef
        .collection(OrgSubCollection.Bookings)
        .doc(secretKey)
        .collection(BookingSubCollection.BookedSlots)
        .doc(slotId);

      deleted[fullId] = await toDelete
        .get()
        .then((snap) => snap.data() as CustomerBookingEntry);

      batch.delete(toDelete);
    })
  );

  batch.commit();
  return {
    timestamp: DateTime.now().toISO(),
    deleted,
  };
};

// #region utils
interface EntryExistsPayload {
  collection: OrgSubCollection;
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
// #endregion utils
