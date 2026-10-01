import { DateTime } from "luxon";

import { SlotInterface } from "@eisbuk/shared";

import { ToolResult } from "./agent";
import {
  BookedIntervals,
  MAX_OPERATIONS,
  MAX_RANGE_DAYS,
  SlotDraft,
  SlotPlan,
  buildSlotPlan,
  countOperations,
  getCreateDateRange,
  getReferencedSlotIds,
  getUnknownSlotIds,
  parseSlotChangeRequest,
} from "./slotPlan";

/**
 * Read access to the slots, as far as the tools need it
 * (implemented by `UserSession`, with the privileges of the admin talking to the bot).
 */
export interface Calendar {
  getSlots(fromDate: string, toDate: string): Promise<SlotInterface[]>;
  getBookedIntervals(
    fromDate: string,
    toDate: string,
  ): Promise<BookedIntervals>;
  getSlotsByIds(ids: string[]): Promise<SlotInterface[]>;
  getBookedIntervalsByIds(ids: string[]): Promise<BookedIntervals>;
}

/**
 * The tools the model can call (see `TOOLS` in `agent.ts` for their description).
 *
 * @param params.calendar where the slots are read from
 * @param params.onPlan called with each plan to put forward to the admin for confirmation
 */
export const createToolExecutor = (params: {
  calendar: Calendar;
  onPlan: (plan: SlotPlan) => Promise<void>;
}) => {
  const { calendar, onPlan } = params;

  /** "Tue 2026-11-03 17:00-18:00": lets the model check the weekday of each slot */
  const describe = (slot: SlotDraft) =>
    [
      DateTime.fromISO(slot.date).setLocale("en").toFormat("ccc yyyy-MM-dd"),
      Object.keys(slot.intervals || {})
        .sort()
        .join(", "),
    ].join(" ");

  const listSlots = async (input: unknown): Promise<ToolResult> => {
    const { fromDate, toDate } = (input || {}) as Record<string, string>;
    const [from, to] = [DateTime.fromISO(fromDate), DateTime.fromISO(toDate)];
    if (!from.isValid || !to.isValid || from > to) {
      return {
        content: "Invalid period: use yyyy-mm-dd dates, fromDate <= toDate",
        isError: true,
      };
    }
    if (to.diff(from, "days").days > MAX_RANGE_DAYS) {
      return {
        content: `The period is too long: at most ${MAX_RANGE_DAYS} days`,
        isError: true,
      };
    }

    const [slots, booked] = await Promise.all([
      calendar.getSlots(fromDate, toDate),
      calendar.getBookedIntervals(fromDate, toDate),
    ]);
    return {
      content: JSON.stringify(
        slots.map(
          ({ id, date, type, categories, intervals, capacity, notes }) => ({
            id,
            date,
            weekday: DateTime.fromISO(date).setLocale("en").toFormat("cccc"),
            type,
            categories,
            intervals: Object.keys(intervals || {}).sort(),
            ...(capacity ? { capacity } : {}),
            ...(notes ? { notes } : {}),
            bookedIntervals: booked[id] || [],
          }),
        ),
      ),
    };
  };

  const proposeSlotChanges = async (input: unknown): Promise<ToolResult> => {
    const { request, errors } = parseSlotChangeRequest(input);
    if (errors.length) {
      return {
        content: `Invalid request:\n- ${errors.join("\n- ")}`,
        isError: true,
      };
    }

    // The slots the model refers to, and the ones already on the days it creates slots on
    const slotIds = getReferencedSlotIds(request);
    const createRange = getCreateDateRange(request);
    const [referenced, booked, onCreateDates] = await Promise.all([
      calendar.getSlotsByIds(slotIds),
      calendar.getBookedIntervalsByIds(slotIds),
      createRange
        ? calendar.getSlots(createRange.fromDate, createRange.toDate)
        : [],
    ]);
    const existing = [
      ...new Map(
        [...referenced, ...onCreateDates].map((slot) => [slot.id, slot]),
      ).values(),
    ];

    const unknownIds = getUnknownSlotIds(request, existing);
    if (unknownIds.length) {
      return {
        content: `No slot with id: ${unknownIds.join(", ")}. Use the ids returned by list_slots.`,
        isError: true,
      };
    }

    const plan = buildSlotPlan(request, existing, booked);

    if (countOperations(plan) > MAX_OPERATIONS) {
      return {
        content: `Too many changes at once (${countOperations(plan)}, the maximum is ${MAX_OPERATIONS}): split the request into shorter periods`,
        isError: true,
      };
    }

    const summary = {
      toCreate: plan.creates.map(describe),
      toUpdate: plan.updates.map(({ after }) => describe(after)),
      toDelete: plan.deletes.map(describe),
      leftOut: plan.skipped.map(
        ({ reason, slot }) => `${describe(slot)}: ${reason}`,
      ),
    };
    if (!countOperations(plan)) {
      return {
        content: JSON.stringify({
          ...summary,
          outcome:
            "Nothing to change, so nothing is shown to the administrator.",
        }),
      };
    }

    await onPlan(plan);

    return {
      content: JSON.stringify({
        ...summary,
        outcome:
          "Nothing has been written. After your reply the system shows the administrator this list with the Conferma / Annulla buttons.",
      }),
    };
  };

  return async (name: string, input: unknown): Promise<ToolResult> => {
    switch (name) {
      case "list_slots":
        return listSlots(input);
      case "propose_slot_changes":
        return proposeSlotChanges(input);
      default:
        return { content: `Unknown tool: ${name}`, isError: true };
    }
  };
};
