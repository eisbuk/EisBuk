import { DateTime } from "luxon";
import admin from "firebase-admin";

import {
  AttendanceAutofixReport,
  BookingSubCollection,
  Collection,
  CustomerBookingEntry,
  CustomerBookings,
  OrgSubCollection,
  SlotAttendanceUpdate,
  SlotAttendnace,
  SlotInterface,
  SlotAttendanceSanityCheckReport,
  map,
  DateMismatchDoc,
  UnpairedDoc,
  wrapIter,
  BookingsSanityCheckReport,
  bookingsRelevantCollections,
  BookingsUnpairedCheckPayload,
  BookingsEntryExistsPayload,
} from "@eisbuk/shared";

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

/**
 * A util used by slot related check cloud function used to find mismatch between slot and booking entries.
 */
export const findSlotBookingsMismatches = async (
  db: Firestore,
  organization: string
): Promise<BookingsSanityCheckReport> => {
  const timestamp = DateTime.now().toISO();

  const orgRef = db.collection(Collection.Organizations).doc(organization);

  const slots = await orgRef
    .collection(OrgSubCollection.Slots)
    .get()
    .then((snap) => snap.docs);
  const bookings = await orgRef
    .collection(OrgSubCollection.Bookings)
    .get()
    .then((snap) => snap.docs);

  const collections = {
    [OrgSubCollection.Slots]: new Map<string, SlotInterface>(
      map(slots, (doc) => [doc.id, doc.data() as SlotInterface])
    ),

    // bookings data to get all the secretKeys
    [OrgSubCollection.Bookings]: new Map<string, CustomerBookings>(
      map(bookings, (doc) => [doc.id, doc.data() as CustomerBookings])
    ),
  };

  // associate bookedSlots with their booking ids
  const bookedSlotsRefs = bookings.map((doc) => ({
    bookingId: doc.id,
    bookedSlotsPromise: doc.ref
      .collection(BookingSubCollection.BookedSlots)
      .get(),
  }));

  // promise.all should preserve the order of promises
  const bookedSlotsSnapshots = await Promise.all(
    [...bookedSlotsRefs].map((ref) => ref.bookedSlotsPromise)
  );

  const bookedSlots = bookedSlotsSnapshots.reduce(
    (acc, bookedSlotsSnapshot, index) => {
      if (!bookedSlotsSnapshot.docs.length) return acc;
      const bookingId = bookedSlotsRefs[index].bookingId;

      const bookedSlotsInBooking: { [slotId: string]: CustomerBookingEntry } =
        {};

      bookedSlotsSnapshot.forEach((doc) => {
        bookedSlotsInBooking[`${doc.id}--${bookingId}`] = {
          ...(doc.data() as CustomerBookingEntry),
        };
      });

      return { ...acc, ...bookedSlotsInBooking };
    },
    {}
  );

  // id: [slotid--bookingid]
  const ids = new Set(Object.keys(bookedSlots));

  const normalisedEntries = wrapIter(ids).map((id) => ({
    id,
    secretKey: id.split("--")[1],
    entries: bookingsRelevantCollections.map((collection) => {
      const entry =
        collection === OrgSubCollection.Slots
          ? collections[collection].get(id.split("--")[0])
          : bookedSlots[id];
      return {
        collection,
        exists: Boolean(entry),
        date: entry?.date,
        intervals:
          collection === OrgSubCollection.Slots
            ? entry?.intervals
            : entry?.interval,
      };
    }),
  }));
  const strayBookings = normalisedEntries._reduce(collectStrayBookings, {});
  const dateMismatches = normalisedEntries._reduce(collectDateMismatches, {});
  const invalidIntervalBookings = normalisedEntries._reduce(
    collectInvalidIntervalBookings,
    {}
  );

  return {
    id: timestamp,
    strayBookings,
    dateMismatches,
    invalidIntervalBookings,
  };
};

// returns bookedSlots with a non-existent slot
const collectStrayBookings = (
  rec: Record<string, BookingsEntryExistsPayload>,
  { id, entries }: BookingsUnpairedCheckPayload
): Record<string, BookingsEntryExistsPayload> => {
  const strayBookings = entries.reduce((acc, innerEntry, i) => {
    // return the bookedslot entry
    if (
      innerEntry.collection === OrgSubCollection.Slots &&
      !innerEntry.exists &&
      entries[i + 1]
    ) {
      return { ...acc, ...entries[i + 1] };
    }
    return acc;
  }, {} as BookingsEntryExistsPayload);

  // Only add strayBookings to the record if it's not empty
  if (Object.keys(strayBookings).length > 0) {
    return { ...rec, [id]: strayBookings };
  }
  return rec;
};
// returns bookings with mismatching dates from their slots
const collectDateMismatches = (
  rec: Record<string, BookingsEntryExistsPayload>,

  { id, entries }: BookingsUnpairedCheckPayload
): Record<string, BookingsEntryExistsPayload> => {
  if (entries.some((entry) => !entry.exists)) return rec;

  // array length should never be not 2
  // first element is the slot
  if (entries[0].date === entries[1].date) {
    return rec;
  }

  return { ...rec, [id]: entries[1] };
};

// returns bookings with nonexistent intervals in their respective slots
const collectInvalidIntervalBookings = (
  rec: Record<string, BookingsEntryExistsPayload>,
  { id, entries }: BookingsUnpairedCheckPayload
): Record<string, BookingsEntryExistsPayload> => {
  if (entries.some((entry) => !entry.exists)) return rec;

  entries.forEach((innerEntry, i) => {
    if (
      i < entries.length - 1 &&
      typeof innerEntry.intervals !== "string" &&
      !innerEntry.intervals[entries[i + 1].intervals as string]
    ) {
      rec[id] = { ...entries[i + 1] };
    }
  });

  return rec;
};

export const attendanceSlotMismatchAutofix = async (
  db: Firestore,
  organization: string,
  mismatches: SlotAttendanceSanityCheckReport
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
