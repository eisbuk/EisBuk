/**
 * @vitest-environment node
 */

import { describe, test, vi, expect, beforeEach, afterEach } from "vitest";
import { DateTime } from "luxon";

import { SlotInterface } from "@eisbuk/shared";
import i18n, { NotificationMessage } from "@eisbuk/translations";
import { baseSlot } from "@eisbuk/testing/slots";

import { ButtonContextType } from "@/enums/components";
import { NotifVariant } from "@/enums/store";

import { enqueueNotification } from "@/features/notifications/actions";

import {
  isPasteLocked,
  pasteSlotsDay,
  pasteSlotsWeek,
  PASTE_COOLDOWN_MS,
} from "../copyPaste";

const { createMissingDocs } = vi.hoisted(() => ({
  createMissingDocs: vi.fn(),
}));

vi.mock("@/utils/firestore", () => ({
  createMissingDocs,
  collection: () => ({}),
  doc: (_: unknown, id: string) => ({ id }),
  getSlotsPath: () => "slots",
}));
vi.mock("@/lib/getters", () => ({ getOrganization: () => "org" }));

const weekStart = DateTime.fromISO("2026-11-02");
const state = {
  firestore: { data: {} },
  copyPaste: {
    day: { "slot-0": { ...baseSlot, id: "slot-0" } },
    week: { weekStart, slots: [{ ...baseSlot, id: "slot-0" }] },
  },
};
const getState = () => state as any;
const extra = { getFirestore: () => ({}) } as any;

/** Each write creates all of the documents passed to it. */
const mockWriteAll = () => {
  createMissingDocs.mockReset();
  createMissingDocs.mockImplementation(async (docs: unknown[]) => docs.length);
};

/** A write which stays pending until resolved/rejected by the test. */
const mockPendingWrite = () => {
  const controls = {} as {
    resolve: (written: number) => void;
    reject: (err: Error) => void;
  };
  const write = new Promise<number>((resolve, reject) => {
    Object.assign(controls, { resolve, reject });
  });
  createMissingDocs.mockReturnValueOnce(write);
  return controls;
};

const skippedNotification = (skipped: number) =>
  enqueueNotification({
    message: i18n.t(NotificationMessage.PasteSlotsSkipped, { skipped }),
    variant: NotifVariant.Success,
  });

const target = weekStart.plus({ weeks: 1 });

describe.each([
  ["pasteSlotsDay", pasteSlotsDay],
  ["pasteSlotsWeek", pasteSlotsWeek],
])("%s: double paste guard", (_, paste) => {
  const dispatch = vi.fn();
  const run = (date: DateTime) => paste(date)(dispatch, getState, extra);

  beforeEach(() => {
    vi.useFakeTimers();
    mockWriteAll();
    dispatch.mockClear();
  });

  afterEach(() => {
    // Expire the cooldown of any lock left by the test
    vi.runAllTimers();
    vi.useRealTimers();
  });

  test("should write once if pasted again with the first paste in flight", async () => {
    const { resolve } = mockPendingWrite();
    const first = run(target);
    await run(target);
    resolve(1);
    await first;
    expect(createMissingDocs).toHaveBeenCalledTimes(1);
  });

  test("should ignore a second click landing right after the commit resolved", async () => {
    await run(target);
    await vi.advanceTimersByTimeAsync(PASTE_COOLDOWN_MS - 1);
    await run(target);
    expect(createMissingDocs).toHaveBeenCalledTimes(1);
  });

  test("should allow a deliberate paste to the same target after the cooldown", async () => {
    await run(target);
    await vi.advanceTimersByTimeAsync(PASTE_COOLDOWN_MS);
    await run(target);
    expect(createMissingDocs).toHaveBeenCalledTimes(2);
  });

  test("should allow pasting to another target while the first paste is in flight", async () => {
    const { resolve } = mockPendingWrite();
    const first = run(target);
    await run(target.plus({ weeks: 1 }));
    expect(createMissingDocs).toHaveBeenCalledTimes(2);
    resolve(1);
    await first;
  });

  test("should release the lock immediately if the commit fails, allowing for a retry", async () => {
    const { reject } = mockPendingWrite();
    const first = run(target);
    reject(new Error("test"));
    await first;
    expect(dispatch).toHaveBeenCalledTimes(1);
    await run(target);
    expect(createMissingDocs).toHaveBeenCalledTimes(2);
  });

  test("should release the lock if the write throws", async () => {
    createMissingDocs.mockImplementationOnce(() => {
      throw new Error("test");
    });
    await run(target);
    expect(dispatch).toHaveBeenCalledTimes(1);
    await run(target);
    expect(createMissingDocs).toHaveBeenCalledTimes(2);
  });

  test("should not lock the target if there's nothing in the clipboard", async () => {
    await paste(target)(dispatch, () => ({ copyPaste: {} }) as any, extra);
    await run(target);
    expect(createMissingDocs).toHaveBeenCalledTimes(1);
  });
});

describe("paste result", () => {
  const dispatch = vi.fn();

  beforeEach(mockWriteAll);

  test("should resolve to 'true' if the slots were committed", async () => {
    const date = target.plus({ weeks: 10 });
    expect(await pasteSlotsDay(date)(dispatch, getState, extra)).toBe(true);
    expect(await pasteSlotsWeek(date)(dispatch, getState, extra)).toBe(true);
  });

  test("should resolve to 'false' if the commit fails", async () => {
    createMissingDocs.mockImplementation(() =>
      Promise.reject(new Error("test")),
    );
    const date = target.plus({ weeks: 11 });
    expect(await pasteSlotsDay(date)(dispatch, getState, extra)).toBe(false);
    expect(await pasteSlotsWeek(date)(dispatch, getState, extra)).toBe(false);
  });

  test("should resolve to 'false', without committing, if the clipboard has no slots", async () => {
    const date = target.plus({ weeks: 12 });
    const emptyClipboard = () =>
      ({ copyPaste: { day: {}, week: { weekStart, slots: [] } } }) as any;
    expect(await pasteSlotsDay(date)(dispatch, emptyClipboard, extra)).toBe(
      false,
    );
    expect(await pasteSlotsWeek(date)(dispatch, emptyClipboard, extra)).toBe(
      false,
    );
    expect(createMissingDocs).not.toHaveBeenCalled();
  });
});

describe("double paste guard: day and week", () => {
  test("should not treat a day paste and a week paste to the same date as duplicates", async () => {
    mockWriteAll();
    const date = target.plus({ weeks: 5 });
    await pasteSlotsDay(date)(vi.fn(), getState, extra);
    await pasteSlotsWeek(date)(vi.fn(), getState, extra);
    expect(createMissingDocs).toHaveBeenCalledTimes(2);
  });
});

describe.each([
  ["pasteSlotsDay", pasteSlotsDay],
  ["pasteSlotsWeek", pasteSlotsWeek],
])("%s: idempotent paste", (_, paste) => {
  const sourceDate = "2026-11-02";
  const targetDate = "2026-11-09";
  const targetDay = DateTime.fromISO(targetDate);

  const slot = (id: string, data: Partial<SlotInterface> = {}) =>
    ({ ...baseSlot, date: sourceDate, ...data, id }) as SlotInterface;

  /** A loaded slot on the target date */
  const loaded = (id: string, data: Partial<SlotInterface> = {}) =>
    slot(id, { date: targetDate, ...data });

  const slotsByDay = (...slots: SlotInterface[]) => {
    const months = {} as Record<string, any>;
    slots.forEach((s) => {
      const month = (months[s.date.substring(0, 7)] ||= {});
      (month[s.date] ||= {})[s.id] = s;
    });
    return months;
  };

  const dispatch = vi.fn();

  /** Pastes the slots and returns the result along with what was written. */
  const run = async (
    clipboard: SlotInterface[],
    loadedSlots: SlotInterface[] = [],
    date = targetDay,
  ) => {
    createMissingDocs.mockClear();
    dispatch.mockClear();
    const getStateMock = () =>
      ({
        firestore: { data: { slotsByDay: slotsByDay(...loadedSlots) } },
        copyPaste: {
          day: Object.fromEntries(clipboard.map((s) => [s.id, s])),
          week: { weekStart, slots: clipboard },
        },
      }) as any;
    const result = await paste(date)(dispatch, getStateMock, extra);
    // Release the lock, for the next paste within a test
    vi.runAllTimers();
    const written = createMissingDocs.mock.calls.flatMap(([docs]) =>
      docs.map(({ doc, data }: any) => ({
        id: doc.id as string,
        data: data as SlotInterface,
      })),
    );
    return { result, written };
  };

  /** The id a slot gets when pasted to the target date */
  const pastedId = async (sourceId: string) =>
    (await run([slot(sourceId)])).written[0].id;

  beforeEach(() => {
    vi.useFakeTimers();
    mockWriteAll();
    dispatch.mockClear();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
  });

  test("should give a slot the same id each time it's pasted to the same date", async () => {
    expect(await pastedId("slot-0")).toEqual(await pastedId("slot-0"));
    expect(await pastedId("slot-0")).toMatch(new RegExp(`^${targetDate}-`));
  });

  test("should give different ids for a different source slot or a different date", async () => {
    const { written } = await run([slot("slot-1", { notes: "other" })]);
    expect(await pastedId("slot-0")).not.toEqual(written[0].id);

    const nextWeek = await run(
      [slot("slot-0")],
      [],
      targetDay.plus({ weeks: 1 }),
    );
    expect(await pastedId("slot-0")).not.toEqual(nextWeek.written[0].id);
  });

  test("should keep the id length fixed when a pasted slot is pasted again", async () => {
    let id = "slot-0";
    const lengths = new Set<number>();
    for (let i = 0; i < 20; i++) {
      // eslint-disable-next-line no-await-in-loop
      id = await pastedId(id);
      lengths.add(id.length);
    }
    expect(lengths.size).toEqual(1);
    expect(id.length).toBeLessThan(100);
  });

  test("should keep a slot and its pasted copy apart when pasted together", async () => {
    const copyId = await pastedId("slot-0");
    const { written } = await run([
      slot("slot-0"),
      slot(copyId, { notes: "edited" }),
    ]);
    expect(written).toHaveLength(2);
    expect(written[0].id).not.toEqual(written[1].id);
  });

  test("should write the id and the target date, with the rest of the slot unchanged", async () => {
    const { written } = await run([slot("slot-0")]);
    const { id, data } = written[0];
    expect(data).toEqual({ ...baseSlot, id, date: targetDate });
  });

  test("should not overwrite a slot whose id exists (and write the others)", async () => {
    const id = await pastedId("slot-0");
    const { result, written } = await run(
      [slot("slot-0"), slot("slot-1", { notes: "other" })],
      [loaded(id, { notes: "edited by an admin" })],
    );
    expect(result).toBe(true);
    expect(written.map(({ data }) => data.notes)).toEqual(["other"]);
  });

  test("should not overwrite a pasted slot which was later moved to another date", async () => {
    const id = await pastedId("slot-0");
    const { written } = await run(
      [slot("slot-0")],
      [loaded(id, { date: "2026-12-01", notes: "moved" })],
    );
    expect(written).toEqual([]);
  });

  test("should skip a slot with the content of a slot on the target date, whatever the order of keys and categories", async () => {
    const { intervals, type, notes } = baseSlot;
    const source = slot("slot-0", { categories: ["a", "b"] as any });
    const reordered = {
      id: "existing",
      type,
      categories: ["b", "a"],
      intervals: Object.fromEntries(Object.entries(intervals).reverse()),
      notes,
      date: targetDate,
    } as any;
    const { written } = await run([source], [reordered]);
    expect(written).toEqual([]);
  });

  test("should write a slot which differs from the slots on the target date", async () => {
    const { written } = await run(
      [slot("slot-0", { notes: "new" })],
      [loaded("existing")],
    );
    expect(written).toHaveLength(1);
  });

  test("should write a slot whose content is only present on another date", async () => {
    const { written } = await run(
      [slot("slot-0")],
      [loaded("existing", { date: "2026-11-10" })],
    );
    expect(written).toHaveLength(1);
  });

  test("should collapse the slots identical within the clipboard", async () => {
    const { written } = await run([
      slot("slot-0"),
      slot("slot-1"),
      slot("slot-2", { notes: "other" }),
    ]);
    expect(written.map(({ data }) => data.notes)).toEqual([
      baseSlot.notes,
      "other",
    ]);
  });

  test("should not collapse or skip identical slots with a capacity (parallel private lessons)", async () => {
    const lesson = { capacity: 1 };
    const { written } = await run(
      [slot("slot-0", lesson), slot("slot-1", lesson)],
      [loaded("existing", lesson)],
    );
    expect(written).toHaveLength(2);
    expect(dispatch).not.toHaveBeenCalled();
  });

  test("should still not overwrite a slot with a capacity whose id exists", async () => {
    const id = await pastedId("slot-0");
    const { result, written } = await run(
      [slot("slot-0", { capacity: 1 })],
      [loaded(id, { capacity: 1, notes: "edited by an admin" })],
    );
    expect(result).toBe(false);
    expect(written).toEqual([]);
  });

  test("should not notify if nothing was skipped", async () => {
    const { result } = await run([slot("slot-0")]);
    expect(result).toBe(true);
    expect(dispatch).not.toHaveBeenCalled();
  });

  test("should say how many slots were skipped, and resolve to 'true' if others were written", async () => {
    const { result } = await run(
      [slot("slot-0"), slot("slot-1", { notes: "other" })],
      [loaded("existing")],
    );
    expect(result).toBe(true);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(skippedNotification(1));
  });

  test("should count the slots the transaction found to exist, which the store didn't know about", async () => {
    createMissingDocs.mockResolvedValueOnce(1);
    const { result } = await run([
      slot("slot-0"),
      slot("slot-1", { notes: "other" }),
    ]);
    expect(result).toBe(true);
    expect(dispatch).toHaveBeenCalledWith(skippedNotification(1));
  });

  test("should resolve to 'false', notify and not stay locked if the transaction found all of the slots", async () => {
    createMissingDocs.mockResolvedValueOnce(0);
    const { result } = await run([slot("slot-0")]);
    expect(result).toBe(false);
    expect(dispatch).toHaveBeenCalledWith(skippedNotification(1));
    expect(isPasteLocked(ButtonContextType.Day, targetDay)).toBe(false);
    expect(isPasteLocked(ButtonContextType.Week, targetDay)).toBe(false);
  });

  test("should not report skipped slots for a click ignored because of the lock", async () => {
    const { resolve } = mockPendingWrite();
    const first = paste(targetDay)(
      dispatch,
      () =>
        ({
          firestore: { data: {} },
          copyPaste: {
            day: { "slot-0": slot("slot-0") },
            week: { weekStart, slots: [slot("slot-0")] },
          },
        }) as any,
      extra,
    );
    const { result } = await run([slot("slot-0")]);
    expect(result).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
    resolve(1);
    await first;
  });

  test("should resolve to 'false', notify and not lock, if there's nothing to write", async () => {
    const skipped = await run([slot("slot-0")], [loaded("existing")]);
    expect(skipped).toEqual({ result: false, written: [] });
    expect(dispatch).toHaveBeenCalledWith(skippedNotification(1));
    expect(isPasteLocked(ButtonContextType.Day, targetDay)).toBe(false);
    expect(isPasteLocked(ButtonContextType.Week, targetDay)).toBe(false);
  });
});

describe("pasteSlotsWeek: idempotent paste", () => {
  test("should keep the same content on different days of the clipboard", async () => {
    vi.useFakeTimers();
    mockWriteAll();
    const slots = [
      { ...baseSlot, id: "monday", date: "2026-11-02" },
      { ...baseSlot, id: "tuesday", date: "2026-11-03" },
    ];
    const getStateMock = () =>
      ({
        firestore: { data: {} },
        copyPaste: { week: { weekStart, slots } },
      }) as any;
    await pasteSlotsWeek(target)(vi.fn(), getStateMock, extra);
    vi.runAllTimers();
    vi.useRealTimers();
    expect(
      createMissingDocs.mock.calls[0][0].map(({ data }: any) => data.date),
    ).toEqual(["2026-11-09", "2026-11-10"]);
  });
});
