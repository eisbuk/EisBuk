/**
 * @vitest-environment node
 */

import { describe, test, vi, expect, beforeEach, afterEach } from "vitest";
import { DateTime } from "luxon";

import { baseSlot } from "@eisbuk/testing/slots";

import { pasteSlotsDay, pasteSlotsWeek, PASTE_COOLDOWN_MS } from "../copyPaste";

const { writeBatch } = vi.hoisted(() => ({ writeBatch: vi.fn() }));

vi.mock("@/utils/firestore", () => ({
  writeBatch,
  collection: () => ({}),
  doc: () => ({}),
  getSlotsPath: () => "slots",
}));
vi.mock("@/lib/getters", () => ({ getOrganization: () => "org" }));

const weekStart = DateTime.fromISO("2026-11-02");
const state = {
  copyPaste: {
    day: { "slot-0": { ...baseSlot, id: "slot-0" } },
    week: { weekStart, slots: [{ ...baseSlot, id: "slot-0" }] },
  },
};
const getState = () => state as any;
const extra = { getFirestore: () => ({}) } as any;

/** A commit which stays pending until resolved/rejected by the test. */
const mockPendingCommit = () => {
  const controls = {} as { resolve: () => void; reject: (err: Error) => void };
  const commit = new Promise<void>((resolve, reject) => {
    Object.assign(controls, { resolve, reject });
  });
  writeBatch.mockReturnValueOnce({ set: vi.fn(), commit: () => commit });
  return controls;
};

const target = weekStart.plus({ weeks: 1 });

describe.each([
  ["pasteSlotsDay", pasteSlotsDay],
  ["pasteSlotsWeek", pasteSlotsWeek],
])("%s: double paste guard", (_, paste) => {
  const dispatch = vi.fn();
  const run = (date: DateTime) => paste(date)(dispatch, getState, extra);

  beforeEach(() => {
    vi.useFakeTimers();
    writeBatch.mockReset();
    writeBatch.mockReturnValue({ set: vi.fn(), commit: async () => {} });
    dispatch.mockClear();
  });

  afterEach(() => {
    // Expire the cooldown of any lock left by the test
    vi.runAllTimers();
    vi.useRealTimers();
  });

  test("should create a single batch if pasted again with the first paste in flight", async () => {
    const { resolve } = mockPendingCommit();
    const first = run(target);
    await run(target);
    resolve();
    await first;
    expect(writeBatch).toHaveBeenCalledTimes(1);
  });

  test("should ignore a second click landing right after the commit resolved", async () => {
    await run(target);
    await vi.advanceTimersByTimeAsync(PASTE_COOLDOWN_MS - 1);
    await run(target);
    expect(writeBatch).toHaveBeenCalledTimes(1);
  });

  test("should allow a deliberate paste to the same target after the cooldown", async () => {
    await run(target);
    await vi.advanceTimersByTimeAsync(PASTE_COOLDOWN_MS);
    await run(target);
    expect(writeBatch).toHaveBeenCalledTimes(2);
  });

  test("should allow pasting to another target while the first paste is in flight", async () => {
    const { resolve } = mockPendingCommit();
    const first = run(target);
    await run(target.plus({ weeks: 1 }));
    expect(writeBatch).toHaveBeenCalledTimes(2);
    resolve();
    await first;
  });

  test("should release the lock immediately if the commit fails, allowing for a retry", async () => {
    const { reject } = mockPendingCommit();
    const first = run(target);
    reject(new Error("test"));
    await first;
    expect(dispatch).toHaveBeenCalledTimes(1);
    await run(target);
    expect(writeBatch).toHaveBeenCalledTimes(2);
  });

  test("should release the lock if the batch can't be created", async () => {
    writeBatch.mockImplementationOnce(() => {
      throw new Error("test");
    });
    await run(target);
    expect(dispatch).toHaveBeenCalledTimes(1);
    await run(target);
    expect(writeBatch).toHaveBeenCalledTimes(2);
  });

  test("should not lock the target if there's nothing in the clipboard", async () => {
    await paste(target)(dispatch, () => ({ copyPaste: {} }) as any, extra);
    await run(target);
    expect(writeBatch).toHaveBeenCalledTimes(1);
  });
});

describe("paste result", () => {
  const dispatch = vi.fn();

  beforeEach(() => {
    writeBatch.mockReset();
    writeBatch.mockReturnValue({ set: vi.fn(), commit: async () => {} });
  });

  test("should resolve to 'true' if the slots were committed", async () => {
    const date = target.plus({ weeks: 10 });
    expect(await pasteSlotsDay(date)(dispatch, getState, extra)).toBe(true);
    expect(await pasteSlotsWeek(date)(dispatch, getState, extra)).toBe(true);
  });

  test("should resolve to 'false' if the commit fails", async () => {
    writeBatch.mockReturnValue({
      set: vi.fn(),
      commit: () => Promise.reject(new Error("test")),
    });
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
    expect(writeBatch).not.toHaveBeenCalled();
  });
});

describe("double paste guard: day and week", () => {
  test("should not treat a day paste and a week paste to the same date as duplicates", async () => {
    writeBatch.mockReset();
    writeBatch.mockReturnValue({ set: vi.fn(), commit: async () => {} });
    const date = target.plus({ weeks: 5 });
    await pasteSlotsDay(date)(vi.fn(), getState, extra);
    await pasteSlotsWeek(date)(vi.fn(), getState, extra);
    expect(writeBatch).toHaveBeenCalledTimes(2);
  });
});
