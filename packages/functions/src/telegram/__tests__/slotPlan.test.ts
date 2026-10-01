import { describe, expect, test } from "vitest";

import { Category, SlotInterface, SlotType } from "@eisbuk/shared";

import {
  SlotChangeRequest,
  buildSlotPlan,
  getCreateDateRange,
  getReferencedSlotIds,
  getUnknownSlotIds,
  parseSlotChangeRequest,
  renderPlanPreview,
} from "../slotPlan";

const newSlot = (date: string, overrides: Record<string, unknown> = {}) => ({
  date,
  type: "ice",
  categories: ["competitive"],
  intervals: [{ startTime: "17:00", endTime: "18:00" }],
  ...overrides,
});

// November 2026 starts on a Sunday: Tuesdays are 3, 10, 17, 24 and Thursdays 5, 12, 19, 26
const tuesdaysAndThursdays = [
  "2026-11-03",
  "2026-11-05",
  "2026-11-10",
  "2026-11-12",
  "2026-11-17",
  "2026-11-24",
  "2026-11-26",
].map((date) => newSlot(date));

const slot = (overrides: Partial<SlotInterface>): SlotInterface => ({
  id: "slot",
  date: "2026-11-03",
  type: SlotType.Ice,
  categories: [Category.Competitive],
  intervals: { "17:00-18:00": { startTime: "17:00", endTime: "18:00" } },
  ...overrides,
});

const parse = (input: unknown): SlotChangeRequest => {
  const { request, errors } = parseSlotChangeRequest(input);
  expect(errors).toEqual([]);
  return request;
};

describe("Telegram bot: slot plan", () => {
  describe("parseSlotChangeRequest", () => {
    test("should accept a valid request: optional fields left out, times zero padded", () => {
      const request = parse({
        create: [
          newSlot("2026-11-03", {
            intervals: [{ startTime: "9:00", endTime: "10:30" }],
          }),
        ],
        update: [{ slotId: "a", capacity: 10 }],
        delete: ["b", "b"],
      });

      expect(request).toEqual({
        create: [
          {
            date: "2026-11-03",
            type: "ice",
            categories: ["competitive"],
            intervals: [{ startTime: "09:00", endTime: "10:30" }],
            capacity: null,
            notes: null,
          },
        ],
        update: [
          {
            slotId: "a",
            type: null,
            categories: null,
            intervals: null,
            capacity: 10,
            removeCapacity: false,
            notes: null,
          },
        ],
        delete: ["b"],
      });
      expect(getReferencedSlotIds(request)).toEqual(["a", "b"]);
      expect(getCreateDateRange(request)).toEqual({
        fromDate: "2026-11-03",
        toDate: "2026-11-03",
      });
    });

    test("should report every problem, with the path of the offending field", () => {
      const { errors } = parseSlotChangeRequest({
        create: [
          newSlot("2026-11-31", {
            categories: [],
            intervals: [{ startTime: "18:00", endTime: "17:00" }],
          }),
        ],
        update: [{ slotId: "a", type: "curling" }, { capacity: 10 }],
        delete: ["a"],
      });
      expect(errors).toEqual([
        "create[0].date: must be a valid yyyy-mm-dd date",
        "create[0].categories: at least one category is required",
        "create[0].intervals[0]: startTime must be before endTime",
        "update[0].type: type must be one of ice, off-ice",
        "update[1].slotId: expected the id of a slot (from list_slots)",
        "update: slot a is both updated and deleted",
      ]);
    });

    test("should reject an empty request and new slots spanning more than a year", () => {
      expect(parseSlotChangeRequest({}).errors).toEqual([
        "input: nothing to create, update or delete was given",
      ]);

      const { errors } = parseSlotChangeRequest({
        create: [newSlot("2026-11-03"), newSlot("2028-01-01")],
      });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatch(/the maximum is 370/);
    });
  });

  describe("buildSlotPlan", () => {
    test("should create the slots as listed, stored the way the web app stores them", () => {
      const request = parse({ create: tuesdaysAndThursdays });
      const plan = buildSlotPlan(request, [], {});

      expect(plan.creates).toHaveLength(7);
      // No empty capacity / notes
      expect(plan.creates[0]).toEqual({
        date: "2026-11-03",
        type: "ice",
        categories: ["competitive"],
        intervals: { "17:00-18:00": { startTime: "17:00", endTime: "18:00" } },
      });
    });

    test("should not create a lesson that's already in the calendar, or one listed twice", () => {
      const request = parse({
        create: [...tuesdaysAndThursdays, newSlot("2026-11-05")],
      });
      const plan = buildSlotPlan(request, [slot({ id: "existing" })], {});

      expect(plan.creates).toHaveLength(6);
      expect(
        plan.skipped.map(({ reason, slot }) => [reason, slot.date]),
      ).toEqual([
        ["duplicate", "2026-11-03"],
        ["duplicate", "2026-11-05"],
      ]);
    });

    test("should not delete slots with bookings", () => {
      const free = slot({ id: "free" });
      const booked = slot({ id: "booked", date: "2026-11-05" });
      const request = parse({ delete: ["free", "booked"] });

      const plan = buildSlotPlan(request, [free, booked], {
        booked: ["17:00-18:00"],
      });

      expect(plan.deletes).toEqual([free]);
      expect(plan.skipped).toEqual([
        { reason: "has-bookings", slot: booked, slotId: "booked" },
      ]);
    });

    test("should only touch the slots the request refers to", () => {
      const slots = [slot({ id: "a" }), slot({ id: "b", date: "2026-11-05" })];
      const request = parse({
        delete: ["b"],
        update: [{ slotId: "c", capacity: 5 }],
      });

      expect(getUnknownSlotIds(request, slots)).toEqual(["c"]);
      expect(buildSlotPlan(request, slots, {}).deletes).toEqual([slots[1]]);
    });

    test("should update a slot, leaving the fields not mentioned as they are", () => {
      const before = slot({ capacity: 10, notes: "Pista 2" });
      const request = parse({
        update: [
          {
            slotId: "slot",
            intervals: [{ startTime: "17:30", endTime: "18:30" }],
            removeCapacity: true,
            notes: "",
          },
        ],
      });

      const plan = buildSlotPlan(request, [before], {});

      expect(plan.updates).toEqual([
        {
          id: "slot",
          before,
          after: slot({
            intervals: {
              "17:30-18:30": { startTime: "17:30", endTime: "18:30" },
            },
          }),
        },
      ]);
    });

    test("should not update a slot if that removes a booked interval, or changes nothing", () => {
      const booked = slot({ id: "booked" });
      const unchanged = slot({
        id: "unchanged",
        date: "2026-11-05",
        intervals: { "17:30-18:30": { startTime: "17:30", endTime: "18:30" } },
      });
      const intervals = [{ startTime: "17:30", endTime: "18:30" }];
      const request = parse({
        update: [
          { slotId: "booked", intervals },
          { slotId: "unchanged", intervals },
        ],
      });

      const plan = buildSlotPlan(request, [booked, unchanged], {
        booked: ["17:00-18:00"],
      });

      expect(plan.updates).toEqual([]);
      expect(plan.skipped).toEqual([
        { reason: "booked-interval-removed", slot: booked, slotId: "booked" },
        { reason: "unchanged", slot: unchanged, slotId: "unchanged" },
      ]);
    });

    test("should allow replacing a lesson: delete the old slot and create it anew", () => {
      const old = slot({ id: "old" });
      const request = parse({ create: tuesdaysAndThursdays, delete: ["old"] });

      const plan = buildSlotPlan(request, [old], {});

      // The lesson being deleted doesn't count as a duplicate of the one created
      expect(plan.deletes).toEqual([old]);
      expect(plan.creates).toHaveLength(7);
      expect(plan.skipped).toEqual([]);
    });
  });

  describe("renderPlanPreview", () => {
    test("should list the exact changes, in Italian, grouped by weekday and lesson", () => {
      const toDelete = slot({ id: "delete", date: "2026-11-07", capacity: 8 });
      const toUpdate = slot({ id: "update", date: "2026-11-06" });
      const booked = slot({
        id: "booked",
        date: "2026-11-14",
        type: SlotType.OffIce,
      });
      const request = parse({
        create: tuesdaysAndThursdays,
        update: [{ slotId: "update", capacity: 12 }],
        delete: ["delete", "booked"],
      });

      const plan = buildSlotPlan(request, [toDelete, toUpdate, booked], {
        booked: ["17:00-18:00"],
      });

      expect(renderPlanPreview(plan)).toEqual(
        [
          "Periodo: 03/11/2026 – 26/11/2026",
          "",
          "➕ Nuovi slot: 7",
          "• mar 03/11, 10/11, 17/11, 24/11 — Ghiaccio 17:00-18:00 · agonismo",
          "• gio 05/11, 12/11, 26/11 — Ghiaccio 17:00-18:00 · agonismo",
          "",
          "✏️ Slot modificati: 1",
          "• ven 06/11 — Ghiaccio 17:00-18:00 · agonismo",
          "   capienza: nessun limite → max 12",
          "",
          "🗑 Slot eliminati: 1",
          "• sab 07/11 — Ghiaccio 17:00-18:00 · agonismo · max 8",
          "",
          "⚠️ Lasciati come sono: 1",
          "• sab 14/11 — Secco 17:00-18:00 · agonismo: ha prenotazioni, non si può eliminare",
        ].join("\n"),
      );
    });
  });
});
