/**
 * @vitest-environment node
 */
import { describe, expect } from "vitest";
import { Firestore } from "@google-cloud/firestore";
import {
  Category,
  SlotType,
  SlotInterface,
  OrgSubCollection,
} from "@eisbuk/shared";
import { adminDb } from "@/__testSetup__/firestoreSetup";
import { setUpOrganization } from "@/__testSetup__/node";
import { testWithEmulator } from "@/__testUtils__/envUtils";
import { waitFor } from "@/__testUtils__/helpers";
import { deliverFirestoreWriteEvent } from "@/__testUtils__/firestoreEvents";
import { slotsSlotsByDayAutofix } from "../../../functions/src/checks/slotSlotsByDay";
import { attendanceSlotMismatchAutofix } from "../../../functions/src/checks/slotAttendance";

const date = "2031-10-10";
const month = "2031-10";
const slotData = (id: string): SlotInterface => ({
  id,
  date,
  type: SlotType.Ice,
  categories: [Category.Competitive],
  intervals: { "10:00-10:50": { startTime: "10:00", endTime: "10:50" } },
});
const setup = async () => {
  const { organization } = await setUpOrganization({ setSecrets: false });
  const org = adminDb.doc(`organizations/${organization}`);
  const slot = org.collection("slots").doc();
  const data = slotData(slot.id);
  await slot.set(data);
  const attendance = org.collection("attendance").doc(slot.id);
  const aggregate = org.collection("slotsByDay").doc(month);
  await waitFor(async () => {
    expect((await attendance.get()).exists).toBe(true);
    expect((await aggregate.get()).data()?.[date]?.[slot.id]).toEqual(data);
  });
  return { slot, data, attendance, aggregate };
};
const isolated = new Firestore({
  projectId: "demo-slot-fixes",
  host: "localhost",
  port: 8081,
  ssl: false,
  customHeaders: { Authorization: "Bearer owner" },
});
const isolatedOrg = () => isolated.collection("organizations").doc();

describe("Slot derived data", () => {
  testWithEmulator(
    "replaces the entire slot leaf and keeps neighboring slots",
    async () => {
      const { slot, data, aggregate } = await setup();
      const old = {
        ...data,
        capacity: 8,
        notes: "Temporary note",
        intervals: {
          ...data.intervals,
          "09:00-09:50": { startTime: "09:00", endTime: "09:50" },
        },
      };
      await slot.set(old);
      await waitFor(async () =>
        expect((await aggregate.get()).data()?.[date]?.[slot.id]?.notes).toBe(
          old.notes
        )
      );
      await aggregate.set(
        { [date]: { neighbor: { marker: "keep" } } },
        { merge: true }
      );
      await slot.set(data);
      await deliverFirestoreWriteEvent("aggregateSlots", slot.path, old, data);
      const actual = (await aggregate.get()).data()?.[date];
      expect(actual?.[slot.id]).toEqual(data);
      expect(actual?.neighbor).toEqual({ marker: "keep" });
    }
  );
  testWithEmulator(
    "moves attendance dates without losing recorded attendance",
    async () => {
      const { slot, data, attendance, aggregate } = await setup();
      const attendances = {
        athlete: {
          bookedInterval: "10:00-10:50",
          attendedInterval: "10:00-10:50",
        },
      };
      await attendance.update({ attendances });
      const moved = { ...data, date: "2031-11-10" };
      await slot.set(moved);
      await deliverFirestoreWriteEvent(
        "triggerAttendanceEntryForSlot",
        slot.path,
        data,
        moved
      );
      expect((await attendance.get()).data()).toEqual({
        date: moved.date,
        attendances,
      });
      await deliverFirestoreWriteEvent(
        "aggregateSlots",
        slot.path,
        data,
        moved
      );
      expect((await aggregate.get()).data()?.[date]?.[slot.id]).toBeUndefined();
    }
  );
  testWithEmulator(
    "a stale delete event preserves attendance for a recreated slot",
    async () => {
      const { slot, data, attendance } = await setup();
      const attendances = {
        athlete: { bookedInterval: null, attendedInterval: "10:00-10:50" },
      };
      await attendance.update({ attendances });
      await deliverFirestoreWriteEvent(
        "triggerAttendanceEntryForSlot",
        slot.path,
        data,
        null
      );
      expect((await attendance.get()).data()).toEqual({ date, attendances });
    }
  );
  testWithEmulator(
    "autofix removes obsolete fields using current source data",
    async () => {
      const org = isolatedOrg();
      const source = slotData("lesson");
      const obsolete = { ...source, capacity: 8, notes: "obsolete" };
      await org.collection("slots").doc(source.id).set(source);
      await org
        .collection("slotsByDay")
        .doc(month)
        .set({ [date]: { [source.id]: obsolete } });
      const report = await slotsSlotsByDayAutofix(isolated as any, org.id, {
        id: "test",
        missingSlotsByDayEntries: {},
        straySlotsByDayEntries: {},
        mismatchedEntries: {
          [source.id]: {
            slots: source,
            slotsByDay: { ...obsolete, dateNamespace: `${month}/${date}` },
          },
        },
      });
      expect(
        (await org.collection("slotsByDay").doc(month).get()).data()?.[date]?.[
          source.id
        ]
      ).toEqual(source);
      await org.collection("reports").doc("fix").set(report);
    }
  );
  testWithEmulator(
    "a stale aggregate repair cannot resurrect a deleted slot",
    async () => {
      const org = isolatedOrg();
      const source = slotData("deleted");
      await slotsSlotsByDayAutofix(isolated as any, org.id, {
        id: "test",
        missingSlotsByDayEntries: { [source.id]: source },
        straySlotsByDayEntries: {},
        mismatchedEntries: {},
      });
      expect(
        (await org.collection("slotsByDay").doc(month).get()).data()?.[date]?.[
          source.id
        ]
      ).toBeUndefined();
    }
  );
  testWithEmulator(
    "a stale attendance repair preserves a recreated slot's attendance",
    async () => {
      const org = isolatedOrg();
      const source = slotData("recreated");
      const entry = {
        date,
        attendances: {
          athlete: { bookedInterval: null, attendedInterval: "10:00-10:50" },
        },
      };
      await org.collection("slots").doc(source.id).set(source);
      await org.collection("attendance").doc(source.id).set(entry);
      const report = await attendanceSlotMismatchAutofix(
        isolated as any,
        org.id,
        {
          id: "test",
          unpairedEntries: {
            [source.id]: {
              existing: [OrgSubCollection.Attendance],
              missing: [OrgSubCollection.Slots],
            },
          },
          dateMismatches: {},
        }
      );
      expect(
        (await org.collection("attendance").doc(source.id).get()).data()
      ).toEqual(entry);
      expect(report.deleted).toEqual({});
    }
  );
  testWithEmulator(
    "attendance date changes refresh athlete attendance history",
    async () => {
      const { slot, attendance } = await setup();
      const customer = slot.parent.parent!.collection("customers").doc();
      const secretKey = customer.id;
      await customer.set({
        id: customer.id,
        secretKey,
        name: "Test",
        surname: "Athlete",
        categories: [Category.Competitive],
      });
      const history = slot.parent
        .parent!.collection("bookings")
        .doc(secretKey)
        .collection("attendedSlots")
        .doc(slot.id);
      const entry = {
        date,
        attendances: {
          [customer.id]: {
            bookedInterval: null,
            attendedInterval: "10:00-10:50",
          },
        },
      };
      await attendance.set(entry);
      await waitFor(async () =>
        expect((await history.get()).data()).toEqual({
          date,
          interval: "10:00-10:50",
        })
      );
      const moved = { ...entry, date: "2031-11-10" };
      await attendance.set(moved);
      await deliverFirestoreWriteEvent(
        "createAttendedSlotOnAttendance",
        attendance.path,
        entry,
        moved
      );
      expect((await history.get()).data()).toEqual({
        date: moved.date,
        interval: "10:00-10:50",
      });
    }
  );
});
