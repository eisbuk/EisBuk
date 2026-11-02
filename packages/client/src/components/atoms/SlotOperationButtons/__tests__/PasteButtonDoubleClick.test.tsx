/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, vi, expect, test, afterEach } from "vitest";
import {
  screen,
  render,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { DateTime } from "luxon";

import { testId } from "@eisbuk/testing/testIds";
import { baseSlot } from "@eisbuk/testing/slots";

import { ButtonContextType } from "@/enums/components";

import SlotOperationButtons from "../SlotOperationButtons";
import PasteButton from "../PasteButton";

const { createMissingDocs, date, slotsByDay } = vi.hoisted(() => ({
  createMissingDocs: vi.fn(),
  date: { current: null as any },
  slotsByDay: { current: undefined as any },
}));

vi.mock("@/utils/firestore", () => ({
  createMissingDocs,
  collection: () => ({}),
  doc: (_: unknown, id: string) => ({ id }),
  getSlotsPath: () => "slots",
}));
vi.mock("@/lib/getters", () => ({ getOrganization: () => "org" }));

const state = () => ({
  firestore: { data: { slotsByDay: slotsByDay.current } },
  copyPaste: {
    day: { "slot-0": { ...baseSlot, id: "slot-0" } },
    week: { weekStart: date.current, slots: [{ ...baseSlot, id: "slot-0" }] },
  },
});

// Run the real thunks, the way the store's thunk middleware would
vi.mock("react-redux", () => ({
  useDispatch: () => (thunk: any) =>
    thunk(vi.fn(), state, { getFirestore: () => ({}) }),
}));

describe("PasteButton: disabled", () => {
  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  test("should not paste on click if the button group is disabled", () => {
    date.current = DateTime.fromISO("2026-11-16");
    const onPaste = vi.fn();
    render(
      <SlotOperationButtons
        date={date.current}
        contextType={ButtonContextType.Week}
        slotsToCopy={{ week: true }}
        disabled
      >
        <PasteButton onPaste={onPaste} />
      </SlotOperationButtons>,
    );
    const button = screen.getByTestId(testId("paste-button"));
    expect(button).toHaveProperty("disabled", true);
    fireEvent.click(button);
    expect(createMissingDocs).not.toHaveBeenCalled();
    expect(onPaste).not.toHaveBeenCalled();
  });

  test("should not paste on click if there's nothing in the clipboard", () => {
    date.current = DateTime.fromISO("2026-11-23");
    render(
      <SlotOperationButtons
        date={date.current}
        contextType={ButtonContextType.Week}
      >
        <PasteButton />
      </SlotOperationButtons>,
    );
    const button = screen.getByTestId(testId("paste-button"));
    expect(button).toHaveProperty("disabled", true);
    fireEvent.click(button);
    expect(createMissingDocs).not.toHaveBeenCalled();
  });
});

describe("PasteButton: paste outcome", () => {
  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  const clickPaste = (dateISO: string) => {
    date.current = DateTime.fromISO(dateISO);
    const onPasteAborted = vi.fn();
    render(
      <SlotOperationButtons
        date={date.current}
        contextType={ButtonContextType.Week}
        slotsToCopy={{ week: true }}
      >
        <PasteButton onPasteAborted={onPasteAborted} />
      </SlotOperationButtons>,
    );
    fireEvent.click(screen.getByTestId(testId("paste-button")));
    return onPasteAborted;
  };

  test("should call 'onPasteAborted' if the write fails", async () => {
    createMissingDocs.mockRejectedValue(new Error("test"));
    const onPasteAborted = clickPaste("2026-11-30");
    await waitFor(() => expect(onPasteAborted).toHaveBeenCalledTimes(1));
  });

  test("should not call 'onPasteAborted' if the write succeeds: the buttons wait for the slots to change", async () => {
    createMissingDocs.mockResolvedValue(1);
    const onPasteAborted = clickPaste("2026-12-07");
    await waitFor(() => expect(createMissingDocs).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve));
    expect(onPasteAborted).not.toHaveBeenCalled();
  });

  test("should call 'onPasteAborted', without writing, if all the slots are already on the target", async () => {
    // The clipboard week starts on the target date, so the slot keeps its date
    slotsByDay.current = {
      [baseSlot.date.substring(0, 7)]: {
        [baseSlot.date]: { existing: { ...baseSlot, id: "existing" } },
      },
    };
    createMissingDocs.mockResolvedValue(0);
    const onPasteAborted = clickPaste("2027-01-04");
    await waitFor(() => expect(onPasteAborted).toHaveBeenCalledTimes(1));
    expect(createMissingDocs).toHaveBeenCalledWith([]);
    slotsByDay.current = undefined;
  });

  test("should call 'onPasteAborted' if the transaction found all of the slots to exist", async () => {
    createMissingDocs.mockResolvedValue(0);
    const onPasteAborted = clickPaste("2027-01-11");
    await waitFor(() => expect(onPasteAborted).toHaveBeenCalledTimes(1));
  });
});

describe("PasteButton: double click", () => {
  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  test.each([
    [ButtonContextType.Day, "2026-11-02"],
    [ButtonContextType.Week, "2026-11-09"],
  ])(
    "contextType=%s: should paste and call 'onPaste' only once",
    async (contextType, dateISO) => {
      date.current = DateTime.fromISO(dateISO);
      createMissingDocs.mockReturnValue(new Promise<number>(() => {}));
      const onPaste = vi.fn();
      render(
        <SlotOperationButtons
          date={date.current}
          contextType={contextType}
          slotsToCopy={{ [contextType]: true }}
        >
          <PasteButton onPaste={onPaste} />
        </SlotOperationButtons>,
      );
      const button = screen.getByTestId(testId("paste-button"));
      fireEvent.click(button);
      fireEvent.click(button);
      expect(createMissingDocs).toHaveBeenCalledTimes(1);
      expect(onPaste).toHaveBeenCalledTimes(1);
    },
  );
});
