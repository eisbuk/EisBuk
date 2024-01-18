import admin from "firebase-admin";
import { DateTime } from "luxon";

import {
  BookingSubCollection,
  BookingsEntryExistsPayload,
  BookingsSanityCheckReport,
  BookingsUnpairedCheckPayload,
  Collection,
  CustomerBookingEntry,
  CustomerBookings,
  OrgSubCollection,
  SlotInterface,
  bookingsRelevantCollections,
  map,
  wrapIter,
} from "@eisbuk/shared";

type Firestore = admin.firestore.Firestore;

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
