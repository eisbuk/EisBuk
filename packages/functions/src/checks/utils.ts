import admin from "firebase-admin";

import {
  Collection,
  OrgSubCollection,
  SlotAttendnace,
  SlotInterface,
  map,
  wrapIter,
} from "@eisbuk/shared";

type Firestore = admin.firestore.Firestore;

export const findSlotAttendanceMismatches = async (
  db: Firestore,
  organization: string
) => {
  const orgRef = db.collection(Collection.Organizations).doc(organization);

  const slots = await orgRef
    .collection(OrgSubCollection.Slots)
    .get()
    .then((snap) => snap.docs);
  const attendances = await orgRef
    .collection(OrgSubCollection.Attendance)
    .get()
    .then((snap) => snap.docs);

  const slotMap = new Map<string, SlotInterface>(
    map(slots, (doc) => [doc.id, doc.data() as SlotInterface])
  );
  const attendanceMap = new Map<string, SlotAttendnace>(
    map(attendances, (doc) => [doc.id, doc.data() as SlotAttendnace])
  );

  // Find unpaired entries (for both slots and attendances): entries that don't have a corresponding
  // entry in the other collection with the same id
  //
  // Get all slots that don't have a corresponding attendance with the same id
  const childlessSlots = wrapIter(slotMap.entries())
    .filter(([id]) => !attendanceMap.has(id))
    ._array();
  // Get all attendances that don't have a corresponding slot with the same id
  const orphanedAttendances = wrapIter(attendanceMap.entries())
    .filter(([id]) => !slotMap.has(id))
    ._array();

  // Remove unpaired entries from their respective maps
  childlessSlots.forEach(([id]) => slotMap.delete(id));
  orphanedAttendances.forEach(([id]) => attendanceMap.delete(id));

  // Find date mismatches
  const dateMismatches = wrapIter(slotMap.values())
    .zip(attendanceMap.values())
    .filter(([slot, attendance]) => slot.date !== attendance.date)
    .map(([{ id, date: slotDate }, { date: attendanceDate }]) => [
      id,
      { slotDate, attendanceDate },
    ])
    ._array();

  const unpairedEntries = {
    slots: childlessSlots,
    attendances: orphanedAttendances,
  };

  return { unpairedEntries, dateMismatches };
};
