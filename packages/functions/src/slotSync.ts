import admin from "firebase-admin";
import _ from "lodash";
import {
  Collection,
  OrgSubCollection,
  SlotInterface,
  SlotAttendnace,
  DateNamespace,
} from "@eisbuk/shared";
import { getStatsDates } from "./customerStats";

type Firestore = admin.firestore.Firestore;
export interface SlotAggregateChange {
  namespace: DateNamespace;
  before: SlotInterface | undefined;
  after: SlotInterface | undefined;
}

export const slotDateNamespace = (date: string): DateNamespace =>
  `${date.substring(0, 7)}/${date}`;

/** Replaces each slot leaf from current source data, leaving neighboring slots intact. */
export const syncSlotAggregate = (
  db: Firestore,
  organization: string,
  slotId: string,
  eventLocations: DateNamespace[]
) => {
  const org = db.collection(Collection.Organizations).doc(organization);
  const source = org.collection(OrgSubCollection.Slots).doc(slotId);
  const aggregates = org.collection(OrgSubCollection.SlotsByDay);
  return db.runTransaction(async (tx) => {
    const data = (await tx.get(source)).data() as SlotInterface | undefined;
    if (data && !getStatsDates(data.date).length) {
      throw new Error("syncSlotAggregate: source slot has an invalid date");
    }
    const current = data ? { ...data, id: slotId } : undefined;
    const currentLocation = current && slotDateNamespace(current.date);
    const locations = [
      ...new Set([
        ...eventLocations,
        ...(currentLocation ? [currentLocation] : []),
      ]),
    ];
    const months = [
      ...new Set(locations.map((location) => location.split("/")[0])),
    ];
    const snapshots = await Promise.all(
      months.map((month) => tx.get(aggregates.doc(month)))
    );
    const byMonth = new Map(
      snapshots.map((snapshot) => [snapshot.id, snapshot.data()])
    );
    const changes: SlotAggregateChange[] = [];
    locations.forEach((namespace) => {
      const [month, date] = namespace.split("/");
      const before = byMonth.get(month)?.[date]?.[slotId] as
        | SlotInterface
        | undefined;
      const after = namespace === currentLocation ? current : undefined;
      if (_.isEqual(before, after)) return;
      // mergeFields selects the whole leaf. merge:true would retain omitted optional
      // fields and removed interval keys inside this slot.
      tx.set(
        aggregates.doc(month),
        {
          [date]: { [slotId]: after || admin.firestore.FieldValue.delete() },
        },
        { mergeFields: [new admin.firestore.FieldPath(date, slotId)] }
      );
      changes.push({ namespace, before, after });
    });
    const addedId = Boolean(data && data.id !== slotId);
    if (addedId) tx.update(source, { id: slotId });
    return { changes, addedId };
  });
};

/** Synchronizes the attendance container and its date without replacing recorded attendance. */
export const syncSlotAttendance = (
  db: Firestore,
  organization: string,
  slotId: string
) => {
  const org = db.collection(Collection.Organizations).doc(organization);
  const source = org.collection(OrgSubCollection.Slots).doc(slotId);
  const attendance = org.collection(OrgSubCollection.Attendance).doc(slotId);
  return db.runTransaction(async (tx) => {
    const slot = (await tx.get(source)).data() as SlotInterface | undefined;
    const before = (await tx.get(attendance)).data() as
      | SlotAttendnace
      | undefined;
    if (slot && !getStatsDates(slot.date).length) {
      throw new Error("syncSlotAttendance: source slot has an invalid date");
    }
    const after = slot
      ? { ...(before || { attendances: {} }), date: slot.date }
      : undefined;
    if (!slot) {
      if (before) tx.delete(attendance);
    } else if (!before) {
      tx.set(attendance, after!);
    } else if (before.date !== slot.date) {
      tx.update(attendance, { date: slot.date });
    }
    return { before, after };
  });
};
