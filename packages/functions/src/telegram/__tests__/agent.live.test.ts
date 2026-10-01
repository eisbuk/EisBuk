/* eslint-disable no-console */
import { describe, expect, test } from "vitest";
import { DateTime } from "luxon";

import { Category, SlotInterface, SlotType } from "@eisbuk/shared";

import { createLlmClient, runAgentTurn } from "../agent";
import { BookedIntervals, SlotPlan } from "../slotPlan";
import { createToolExecutor } from "../tools";

/**
 * Runs real requests through the real model, against a calendar held in memory.
 * Skipped unless a Fireworks API key is given this way (each run is billed):
 *
 *   TELEGRAM_BOT_LIVE_TEST_KEY=... npx vitest run agent.live
 */
const apiKey = process.env.TELEGRAM_BOT_LIVE_TEST_KEY;

const now = DateTime.fromISO("2026-10-01T21:30:00", { zone: "Europe/Rome" });

// #region calendar
const lesson = (
  id: string,
  date: string,
  time: [string, string],
  overrides: Partial<SlotInterface> = {},
): SlotInterface => ({
  id,
  date,
  type: SlotType.Ice,
  categories: [Category.Competitive],
  intervals: {
    [time.join("-")]: { startTime: time[0], endTime: time[1] },
  },
  ...overrides,
});

/** October 2026: agonismo on Mondays, corso ragazzi on Saturdays, one off-ice lesson */
const slots: SlotInterface[] = [
  ...["05", "12", "19", "26"].map((day) =>
    lesson(`mon-${day}`, `2026-10-${day}`, ["17:00", "18:00"]),
  ),
  ...["03", "10", "17", "24", "31"].map((day) =>
    lesson(`sat-${day}`, `2026-10-${day}`, ["10:00", "11:00"], {
      categories: [Category.CourseMinors],
      capacity: 15,
    }),
  ),
  lesson("wed-14", "2026-10-14", ["18:00", "19:00"], {
    type: SlotType.OffIce,
  }),
];
const booked: BookedIntervals = { "sat-17": ["10:00-11:00"] };

const pick = (ids: string[]) =>
  Object.fromEntries(Object.entries(booked).filter(([id]) => ids.includes(id)));
const calendar = {
  getSlots: async (from: string, to: string) =>
    slots.filter(({ date }) => date >= from && date <= to),
  getBookedIntervals: async (from: string, to: string) =>
    pick(
      slots
        .filter(({ date }) => date >= from && date <= to)
        .map(({ id }) => id),
    ),
  getSlotsByIds: async (ids: string[]) =>
    slots.filter(({ id }) => ids.includes(id)),
  getBookedIntervalsByIds: async (ids: string[]) => pick(ids),
};
// #endregion calendar

/** Sends one message to the model, returns its reply and the last plan it proposed (if any) */
const ask = async (userText: string) => {
  const plans: SlotPlan[] = [];
  const calls: string[] = [];
  const executeTool = createToolExecutor({
    calendar,
    onPlan: async (plan) => {
      plans.push(plan);
    },
  });

  const { reply } = await runAgentTurn({
    llm: createLlmClient({ apiKey: apiKey as string }),
    history: [],
    userText,
    now,
    executeTool: async (name, input) => {
      const result = await executeTool(name, input);
      calls.push(
        `${name}${result.isError ? ` -> ERROR ${result.content}` : ""}`,
      );
      return result;
    },
  });

  const plan = plans[plans.length - 1];
  console.log(
    [
      `> ${userText}`,
      `tools: ${calls.join(" | ") || "(none)"}`,
      `reply: ${reply}`,
      plan &&
        `plan: +${plan.creates.length} ~${plan.updates.length} -${plan.deletes.length} skipped ${plan.skipped.length}`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return { reply, plan };
};

const datesBetween = (from: string, to: string, weekdays: number[]) => {
  const dates: string[] = [];
  for (
    let day = DateTime.fromISO(from);
    day <= DateTime.fromISO(to);
    day = day.plus({ days: 1 })
  ) {
    if (weekdays.includes(day.weekday)) dates.push(day.toISODate());
  }
  return dates;
};

describe.skipIf(!apiKey)("Telegram bot: live model", () => {
  const timeout = 180000;

  test(
    "should list every date of a recurring lesson",
    async () => {
      const { plan } = await ask(
        "Crea ghiaccio per agonismo ogni martedì e giovedì di novembre dalle 17 alle 18",
      );

      expect(plan.creates.map(({ date }) => date).sort()).toEqual(
        datesBetween("2026-11-01", "2026-11-30", [2, 4]),
      );
      expect(
        new Set(
          plan.creates.map((slot) =>
            JSON.stringify({ ...slot, date: undefined }),
          ),
        ),
      ).toEqual(
        new Set([
          JSON.stringify({
            type: "ice",
            categories: ["competitive"],
            intervals: {
              "17:00-18:00": { startTime: "17:00", endTime: "18:00" },
            },
          }),
        ]),
      );
    },
    timeout,
  );

  test(
    "should delete the slots asked for, by id, leaving the booked one alone",
    async () => {
      const { plan } = await ask(
        "Elimina tutti gli slot del sabato di ottobre",
      );

      expect(plan.deletes.map(({ id }) => id).sort()).toEqual([
        "sat-03",
        "sat-10",
        "sat-24",
        "sat-31",
      ]);
      expect(plan.creates).toEqual([]);
      expect(plan.updates).toEqual([]);
    },
    timeout,
  );

  test(
    "should update the slots asked for",
    async () => {
      const { plan } = await ask(
        "Sposta dalle 18 alle 19 gli slot di ghiaccio del lunedì di ottobre",
      );

      expect(
        plan.updates.map(({ id, after }) => [id, Object.keys(after.intervals)]),
      ).toEqual(
        ["05", "12", "19", "26"].map((day) => [`mon-${day}`, ["18:00-19:00"]]),
      );
      expect(plan.creates).toEqual([]);
      expect(plan.deletes).toEqual([]);
    },
    timeout,
  );

  test(
    "should ask rather than guess when the request is incomplete",
    async () => {
      const { reply, plan } = await ask("Aggiungi uno slot domani");

      expect(plan).toBeUndefined();
      expect(reply).toMatch(/\?/);
    },
    timeout,
  );

  test(
    "should handle a season: three months of lessons with a holiday break",
    async () => {
      const { plan } = await ask(
        "Metti ghiaccio agonismo lunedì, mercoledì e venerdì dalle 6:30 alle 7:30, da inizio novembre a fine gennaio, tranne dal 24 dicembre al 6 gennaio compresi",
      );

      expect(plan.creates.map(({ date }) => date).sort()).toEqual(
        datesBetween("2026-11-01", "2027-01-31", [1, 3, 5]).filter(
          (date) => date < "2026-12-24" || date > "2027-01-06",
        ),
      );
    },
    timeout,
  );
});
