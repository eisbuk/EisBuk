import admin from "firebase-admin";
import { DateTime } from "luxon";
import _ from "lodash";

import {
  Collection,
  DateNamespace,
  DatedSlotId,
  ID,
  OrgSubCollection,
  PickRequired,
  SlotInterface,
  SlotSlotsByDaySanityCheckReport,
  SlotWithDateNamespace,
  SlotsByDayAutofixReport,
  SlotsByDayMismatchedDoc,
  SlotsByDayUpdate,
  SlotsById,
  map,
  valueMapper,
  wrapIter,
} from "@eisbuk/shared";

type Firestore = admin.firestore.Firestore;

/** A structure commonly used in different pipelines while checking for 'slots' / 'slotsByDay' mismatches */
interface IntermediateEntry {
  id: string;
  slotsEntry?: SlotInterface;
  slotsByDayEntries?: SlotWithDateNamespace[];
}

/**
 * A util used by slot related check cloud function used to find mismatch between slot and attendance entries.
 */
export const findSlotSlotsByDayMismatches = async (
  db: Firestore,
  organization: string
): Promise<SlotSlotsByDaySanityCheckReport> => {
  const timestamp = DateTime.now().toISO();

  // We're only checking for slots/attendances in the last 3 months
  // This will actually be between 3 and 4 months to start from the beginning of the T-3 month and include the partial final month (up until today)
  const startDate = DateTime.now()
    .minus({ months: 3 })
    .startOf("month")
    .toISODate()
    // We're taking the month segment of the start date so that 'date' fields, as well as month strings (used to id the 'slotsByDay' documents)
    // are included in the constraint, e.g.:
    //
    // start date = "2021-02"
    // "2021-02-02" >= "2021-02" => true ('slots' entry with the date inside the constraint)
    // "2021-02" >= "2021-02" => true (first 'slotsByDay' document we're taking into account)
    .substring(0, 7);

  const orgRef = db.collection(Collection.Organizations).doc(organization);
  const [slots, slotsByDay] = await Promise.all([
    orgRef
      .collection(OrgSubCollection.Slots)
      .where("date", ">=", startDate)
      .orderBy("date", "asc")
      .get()
      .then((snap) => snap.docs),
    orgRef
      .collection(OrgSubCollection.SlotsByDay)
      .where(admin.firestore.FieldPath.documentId(), ">=", startDate)
      .get()
      .then((snap) => snap.docs),
  ]);

  const slotsByDayMap = new Map(
    wrapIter(slotsByDay)
      // { month => { [date: string]: SlotsById } } pairs
      .map((doc) => [doc.id, doc.data()] as [string, Record<string, SlotsById>])
      // { month => Array<{ date => SlotsById }> } pairs
      .map(valueMapper((s) => Object.entries(s)))
      // { dateNamespace => { [slotId: string]: SlotInterface } } pairs
      // dateNamespace = `${month}/${date}`
      .flatMap(([month, days]) =>
        days.map(
          ([date, slots]) => [`${month}/${date}`, slots] as [string, SlotsById]
        )
      )
      // { dateNamespace => Array<{ id => SlotInterface }> } pairs
      .map(valueMapper((d) => Object.entries(d)))
      // { id => SlotWithDateNamespace } pairs
      .flatMap(([dateNamespace, slots]) =>
        slots.map(
          ([id, slot]) =>
            [id, { ...slot, dateNamespace }] as [string, SlotWithDateNamespace]
        )
      )
      // Group entries by slot id:
      // { id => Iterable<SlotWithDateNamespace> } pairs
      //
      // We're doing this to show multiple entries for same slot id (in case there are any).
      // This lets us create a Map from entries, while guaranteeing that there will be only one entry per slot id (Map keys are unique).
      ._group(ID)
      .map(
        ([id, slots]) => [id, [...slots]] as [string, SlotWithDateNamespace[]]
      )
  );

  const slotsMap = new Map(
    map(slots, (doc) => [doc.id, doc.data()] as [string, SlotInterface])
  );

  const ids = new Set([...slotsMap.keys(), ...slotsByDayMap.keys()]);

  // Create a list of faulty entries first so that the checks further down the pipeline have less data to process / collect
  const faultyEntries = wrapIter(ids)
    .map((id) => ({
      id,
      slotsEntry: slotsMap.get(id),
      slotsByDayEntries: slotsByDayMap.get(id),
    }))
    // Filter out matched entries
    .filter(
      ({ slotsEntry, slotsByDayEntries }: IntermediateEntry) =>
        // If there's no entry in 'slots' collection, this should get picked up by the 'straySlotsByDayEntries' check
        !slotsEntry ||
        // If there's no 'slotsByDay' entry or there are more than one, this should get picked up by 'missingSlotsByDayEntries' or 'straySlotsByDayEntries' checks respectively
        slotsByDayEntries?.length !== 1 ||
        // If there's only one entry in 'slotsByDay' collection, but it doesn't fully match the 'slots' entry, this should get picked up by the 'mismatchedEntries' check
        !matchSlot(slotsEntry, slotsByDayEntries[0])
    )
    .map(({ id, slotsEntry, slotsByDayEntries }) => ({
      id,
      slotsEntry,
      slotsByDayEntries,
    }))
    ._array();

  // Stray 'slotsByDay' entries are 'slotsByDay' entries that don't have a corresponding 'slots' collection entry.
  // The "corresponding" 'slots' entry is matched by data namespace, so, if there are multiple 'slotsByDay' entries, there
  // can be at most one matching the 'slots' entry by date / dataNamespace match.
  //
  // All of the stray entries found here should essentially be deleted.
  const straySlotsByDayEntries = Object.fromEntries(
    wrapIter(faultyEntries)
      // Filter out non-stray 'slotsByDay' entries for each slot
      // (if 'slotsEntry' is undefined, the match will always be false)
      .map(({ id, slotsEntry, slotsByDayEntries }) => ({
        id,
        slotsEntry,
        slotsByDayEntries: slotsByDayEntries?.filter(
          ({ dateNamespace }) =>
            !matchDateNamespace(slotsEntry?.date, dateNamespace)
        ),
      }))
      // Filter out entries with empty 'slotsByDay' (at this point, 'slotsByDay' will only include stray entries)
      .filter(hasSlotsByDayEntries)
      .map(({ id, slotsByDayEntries }) => [id, slotsByDayEntries!])
  );

  // Missing 'slotsByDay' entries are entries from 'slots' collection that don't have a corresponding 'slotsByDay' entry.
  // The "corresponding" entries are found by matching the 'slots' entry's date with the 'slotsByDay' entry's date namespace.
  //
  // Note: If there's a 'slotsByDay' entry with the same id as some entry in 'slots' collection, but they're not matched by date / dateNamespace,
  // if will be noted in both 'straySlotsByDayEntries' (the 'slotsByDay' entry with wrong date) and 'missingSlotsbyDayEntries' (the entry from 'slots' collection)
  // making the autopfix trivial: the former should be deleted, the latter should get an appropriate 'slotsByDay' entry created.
  const missingSlotsByDayEntries = Object.fromEntries(
    wrapIter(faultyEntries)
      // Here we're only interested in slots that DO have 'slots' entry, but are lacking a corresponding 'slotsByDay' entry
      .filter(hasSlotsEntry)
      // Filter out entries with at least one 'slotsByDay' entry matched by dateNamespace,
      // leaving us with entries that have no matching 'slotsByDay' entry
      .filter(
        ({ slotsEntry, slotsByDayEntries }) =>
          !slotsByDayEntries?.some(({ dateNamespace }) =>
            matchDateNamespace(slotsEntry!.date, dateNamespace)
          )
      )
      .map(({ id, slotsEntry }) => [id, slotsEntry!])
  );

  // Mismatched entries are ONLY corresponding slots (matched by date / date namespace), with some mismatched fields.
  //
  // These should be updates so that the 'slots' collection entry is copied over to 'slotsByDay' collection (overwriting the mismatched fields).
  const mismatchedEntries = Object.fromEntries(
    wrapIter(faultyEntries)
      .map(
        // Filter out 'slotsByDay' entries that don't match the 'slots' entry's date.
        // This will leave us with at most one 'slotsByDay' entry matched by dateNamespace.
        ({ id, slotsEntry, slotsByDayEntries }) => ({
          id,
          slotsEntry,
          slotsByDayEntries: slotsByDayEntries?.filter(({ dateNamespace }) =>
            matchDateNamespace(slotsEntry?.date, dateNamespace)
          ),
        })
      )
      // Filter out slots with no matched 'slotsByDay' entries
      .filter(hasSlotsByDayEntries)
      // Filter out deeply matching slots / slotsByDay entries
      //
      // This will have mostly been done at the initial check (when filtering out for faulty slots),
      // but there's a chance some entries initially had multiple 'slotsByDay' entries, rendering them faulty,
      // but still have one deeply matching 'slotsByDay' entry, making them valid in this part of the check.
      .filter(
        ({ slotsEntry, slotsByDayEntries }) =>
          !matchSlot(slotsEntry, slotsByDayEntries && slotsByDayEntries[0])
      )
      .map(({ id, slotsEntry, slotsByDayEntries }) => [
        id,
        {
          slots: slotsEntry!,
          slotsByDay: slotsByDayEntries![0],
        },
      ])
  );

  return {
    id: timestamp,
    straySlotsByDayEntries,
    missingSlotsByDayEntries,
    mismatchedEntries,
  };
};

export const slotsSlotsByDayAutofix = async (
  db: Firestore,
  organization: string,
  mismatches: SlotSlotsByDaySanityCheckReport
): Promise<SlotsByDayAutofixReport> => {
  const {
    missingSlotsByDayEntries,
    straySlotsByDayEntries,
    mismatchedEntries,
  } = mismatches;

  // We're writing the updates in-memory before committing them to the db (this will result in max 4 writes to the db)
  const updates: {
    [month: string]: {
      [date: string]: {
        [id: string]: SlotInterface | admin.firestore.FieldValue;
      };
    };
  } = {};

  const upsertSlotsByDay = ({
    id,
    date,
    month,
    ...entry
  }: SlotInterface & { month: string }) => {
    _.set(updates, `${month}.${date}.${id}`, { id, date, ...entry });
  };
  const deleteSlotsByDay = ({
    id,
    date,
    month,
  }: SlotInterface & { month: string }) => {
    _.set(
      updates,
      `${month}.${date}.${id}`,
      admin.firestore.FieldValue.delete()
    );
  };

  // Prepare the update actions for each action type
  const toCreate = Object.entries(missingSlotsByDayEntries).map(
    ([id, slot]) => ({ ...slot, month: slot.date.substring(0, 7), id })
  );
  const toDelete = Object.entries(straySlotsByDayEntries).flatMap(
    ([id, slots]) =>
      slots.map((slot) => ({ ...slot, month: slot.date.substring(0, 7), id }))
  );
  const toUpdate = Object.entries(mismatchedEntries).map(([id, { slots }]) => ({
    ...slots,
    month: slots.date.substring(0, 7),
    id,
  }));

  // Apply updates to buffered in-memory 'slotsByDay'
  toCreate.forEach(upsertSlotsByDay);
  toUpdate.forEach(upsertSlotsByDay);
  toDelete.forEach(deleteSlotsByDay);

  // Collect 'slotsByDay' updates for the report
  const created = toCreate.map(
    ({ id, date }): DatedSlotId => `${date.substring(0, 7)}/${date}/${id}`
  );
  const deleted = toDelete.map(
    ({ id, date }): DatedSlotId => `${date.substring(0, 7)}/${date}/${id}`
  );
  const updated = Object.fromEntries(
    toUpdate.map(({ id, date }): [DatedSlotId, SlotsByDayUpdate] => [
      `${date.substring(0, 7)}/${date}/${id}`,
      calcUpdateDiff(mismatchedEntries[id]),
    ])
  );

  // Collect updates for 'slots' collection (this will only happen in case a 'slots' entry is missing an id)
  const slotsMissingIds = wrapIter(Object.entries(mismatchedEntries))
    .filter(([, { slots }]) => !slots.id)
    .map(([id]) => id)
    ._array();

  // Write updates to the db
  const batch = db.batch();

  const orgRef = db.collection(Collection.Organizations).doc(organization);
  const slotsByDayCollRef = orgRef.collection(OrgSubCollection.SlotsByDay);
  const slotsCollRef = orgRef.collection(OrgSubCollection.Slots);

  // Slots by day db updates
  Object.entries(updates).forEach(([month, data]) =>
    batch.set(slotsByDayCollRef.doc(month), data, { merge: true })
  );

  // Slots db updates
  slotsMissingIds.forEach((id) =>
    batch.set(slotsCollRef.doc(id), { id }, { merge: true })
  );

  await batch.commit();

  return {
    timestamp: DateTime.now().toISO(),
    created,
    deleted,
    updated,
    addedIds: slotsMissingIds,
  };
};

// #region utils
const matchSlot = (
  slots: SlotInterface | undefined,
  slotsByDay: SlotWithDateNamespace | undefined
) => {
  return _.isEqual(slots, _.omit(slotsByDay, "dateNamespace"));
};

const hasSlotsByDayEntries = (
  entry: IntermediateEntry
): entry is PickRequired<IntermediateEntry, "slotsByDayEntries"> =>
  Boolean(entry.slotsByDayEntries?.length);

const hasSlotsEntry = (
  x: IntermediateEntry
): x is PickRequired<IntermediateEntry, "slotsEntry"> => Boolean(x.slotsEntry);

const matchDateNamespace = (
  date: string | undefined,
  dateNamespace: DateNamespace | undefined
) => {
  if (!date || !dateNamespace) return false;

  const [nMonth, nDate] = dateNamespace.split("/");
  return (
    // Date segment is correctly namespaced under the appropriate month segment
    nDate.startsWith(nMonth) &&
    // Slot date and date segment (of date namespace) match
    nDate === date
  );
};

const calcUpdateDiff = ({
  slots,
  slotsByDay,
}: SlotsByDayMismatchedDoc): SlotsByDayUpdate =>
  Object.fromEntries(
    Object.keys({ ...slots, ..._.omit(slotsByDay, "dateNamespace") })
      // Filter out 'id' as it's often added to the 'slots' entry, not 'slotsByDay' entry
      .filter((k) => k !== "id")
      .map(
        (key) => [key, { before: slotsByDay[key], after: slots[key] }] as const
      )
      .filter(([, { before, after }]) => !_.isEqual(before, after))
  );
// #endregion utils
