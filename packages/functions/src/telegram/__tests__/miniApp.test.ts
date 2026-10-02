import crypto from "crypto";
import vm from "vm";
import { describe, expect, test } from "vitest";

import { Category, SlotInterface, SlotType } from "@eisbuk/shared";

import { getMiniAppUserId } from "../miniAppAuth";
import { MINI_APP_PAGE } from "../miniAppPage";
import { SlotPlan, applySelection, buildPlanView } from "../slotPlan";

const botToken = "1234:bot-token";
const now = Date.parse("2026-10-02T08:00:00Z");

/** Launch data as Telegram hands it to a mini app, signed for the given bot */
const sign = (fields: Record<string, string>, token = botToken) => {
  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(token)
    .digest();
  const hash = crypto
    .createHmac("sha256", secretKey)
    .update(
      Object.keys(fields)
        .sort()
        .map((key) => `${key}=${fields[key]}`)
        .join("\n"),
    )
    .digest("hex");
  return String(new URLSearchParams({ ...fields, hash }));
};

const fields = {
  query_id: "AAF9",
  user: JSON.stringify({ id: 42, first_name: "Sil", language_code: "it" }),
  auth_date: String(now / 1000 - 60),
  signature: "ed25519-signature-for-third-parties",
};

describe("Telegram bot: mini app launch data", () => {
  test("should tell who opened the mini app, if Telegram signed the data for this bot", () => {
    expect(getMiniAppUserId(sign(fields), botToken, now)).toEqual(42);
  });

  test("should reject data that was tampered with, or signed for another bot", () => {
    const tampered = new URLSearchParams(sign(fields));
    tampered.set("user", JSON.stringify({ id: 43 }));

    expect(getMiniAppUserId(String(tampered), botToken, now)).toEqual(null);
    expect(
      getMiniAppUserId(sign(fields, "9999:other-bot"), botToken, now),
    ).toEqual(null);
    expect(getMiniAppUserId("user=%7B%22id%22%3A42%7D", botToken, now)).toEqual(
      null,
    );
    expect(getMiniAppUserId(undefined, botToken, now)).toEqual(null);
  });

  test("should reject data signed more than an hour ago", () => {
    const old = { ...fields, auth_date: String(now / 1000 - 3700) };
    expect(getMiniAppUserId(sign(old), botToken, now)).toEqual(null);
  });
});

const slot = (id: string, date: string): SlotInterface => ({
  id,
  date,
  type: SlotType.Ice,
  categories: [Category.Competitive],
  intervals: { "17:00-18:00": { startTime: "17:00", endTime: "18:00" } },
});
const draft = (date: string) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...rest } = slot("", date);
  return rest;
};

const plan: SlotPlan = {
  creates: ["2026-11-05", "2026-11-03", "2026-11-10"].map(draft),
  updates: [
    {
      id: "u",
      before: slot("u", "2026-11-06"),
      after: { ...slot("u", "2026-11-06"), capacity: 12 },
    },
  ],
  deletes: [slot("a", "2026-11-07"), slot("b", "2026-11-14")],
  skipped: [{ reason: "has-bookings", slot: slot("c", "2026-11-21") }],
};

describe("Telegram bot: plan as shown in the mini app", () => {
  test("should narrow a plan down to the changes the admin kept, and nothing else", () => {
    const selected = applySelection(plan, {
      creates: [0, 2, 9],
      updates: [],
      deletes: ["b", "not-in-the-plan"],
    });

    expect(selected.creates.map(({ date }) => date)).toEqual([
      "2026-11-05",
      "2026-11-10",
    ]);
    expect(selected.updates).toEqual([]);
    expect(selected.deletes.map(({ id }) => id)).toEqual(["b"]);
  });

  test("should group new slots by lesson and weekday, keeping their position in the plan as the key", () => {
    expect(buildPlanView(plan)).toEqual({
      period: "03/11/2026 – 14/11/2026",
      creates: [
        {
          type: "ice",
          title: "Ghiaccio 17:00-18:00",
          subtitle: "agonismo",
          weekdays: [
            {
              label: "mar",
              dates: [
                { index: 1, label: "3 nov" },
                { index: 2, label: "10 nov" },
              ],
            },
            { label: "gio", dates: [{ index: 0, label: "5 nov" }] },
          ],
        },
      ],
      updates: [
        {
          id: "u",
          title: "ven 06/11 — Ghiaccio 17:00-18:00 · agonismo",
          changes: ["capienza: nessun limite → max 12"],
        },
      ],
      deletes: [
        { id: "a", title: "sab 07/11 — Ghiaccio 17:00-18:00 · agonismo" },
        { id: "b", title: "sab 14/11 — Ghiaccio 17:00-18:00 · agonismo" },
      ],
      skipped: [
        {
          title: "sab 21/11 — Ghiaccio 17:00-18:00 · agonismo",
          reason: "ha prenotazioni, non si può eliminare",
        },
      ],
    });
  });
});

describe("Telegram bot: mini app page", () => {
  test("should be a self contained page whose script parses", () => {
    const [, script] = /<script>\n([\s\S]*)<\/script>\n<\/body>/.exec(
      MINI_APP_PAGE,
    ) as RegExpExecArray;

    // Compiling throws on a syntax error (the script isn't run)
    expect(() => new vm.Script(script)).not.toThrow();
    // Data is only ever inserted as text
    expect(script).not.toMatch(/innerHTML|insertAdjacentHTML|document\.write/);
  });
});
