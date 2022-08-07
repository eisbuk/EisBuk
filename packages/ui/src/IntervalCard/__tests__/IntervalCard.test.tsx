import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

import { SlotType } from "@eisbuk/shared";

import { IntervalCardState, IntervalCardVariant } from "../types";

import IntervalCard from "../IntervalCard";
import userEvent from "@testing-library/user-event";

const baseProps = {
  date: "2022-04-01",
  interval: {
    startTime: "09:00",
    endTime: "10:00",
  },
  type: SlotType.Ice,
};

interface TestParams {
  variant: IntervalCardVariant;
  state: IntervalCardState;
  onBook: boolean;
  onCancel: boolean;
}

const runBookingTableTests = (tests: TestParams[]) => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  const mockOnBook = jest.fn();
  const mockOnCancel = jest.fn();

  tests.forEach(({ variant, state, onBook, onCancel }) =>
    test(`variant: "${variant}", state: "${state}", should call 'onBook': ${onBook}, should call 'onCancel': ${onCancel}`, () => {
      render(
        <IntervalCard
          {...{ ...baseProps, variant, state }}
          onBook={mockOnBook}
          onCancel={mockOnCancel}
        />
      );

      const button = screen.queryByText("Book") || screen.queryByText("Cancel");
      button!.click();

      expect(mockOnBook).toHaveBeenCalledTimes(Number(onBook));
      expect(mockOnCancel).toHaveBeenCalledTimes(Number(onCancel));
    })
  );
};

describe("IntervalCard", () => {
  describe("Table tests", () => {
    runBookingTableTests([
      // Variant: "Booking"
      {
        variant: IntervalCardVariant.Booking,
        state: IntervalCardState.Default,
        onBook: true,
        onCancel: false,
      },
      {
        variant: IntervalCardVariant.Booking,
        state: IntervalCardState.Active,
        onBook: false,
        onCancel: true,
      },
      {
        variant: IntervalCardVariant.Booking,
        state: IntervalCardState.Disabled,
        onBook: false,
        onCancel: false,
      },

      // Variant: "Calendar"
      {
        variant: IntervalCardVariant.Calendar,
        state: IntervalCardState.Default,
        onBook: false,
        onCancel: true,
      },
      {
        variant: IntervalCardVariant.Calendar,
        state: IntervalCardState.Active,
        onBook: false,
        onCancel: true,
      },
      {
        variant: IntervalCardVariant.Calendar,
        state: IntervalCardState.Disabled,
        onBook: false,
        onCancel: false,
      },
    ]);
  });

  describe("Test NotesSection in calendar card", () => {
    const mockOnNotesEditStart = jest.fn();
    // We're using an async function to handle 'onNotesEditSave' in order
    // to simulate (and test) real world behaviour where the save will be an
    // async function writing to db
    const mockOnNotesEditSave = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 100);
        })
    );

    beforeEach(() => {
      const bookingNotes = "test-notes";
      render(
        <IntervalCard
          {...{ ...baseProps, bookingNotes }}
          variant={IntervalCardVariant.Calendar}
          onNotesEditStart={mockOnNotesEditStart}
          onNotesEditSave={mockOnNotesEditSave}
        />
      );
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test("should display 'notes', but disable edit and action buttons if not in editing mode", () => {
      screen.getByText("test-notes");
      expect(screen.queryByRole("textbox")).toBeFalsy();

      // The last two buttons should be 'cancel' and 'confirm' buttons on 'NotesSection'
      const notesActionButtons = screen.getAllByRole("button").slice(2);
      notesActionButtons.forEach((b) =>
        expect(b).toHaveProperty("disabled", true)
      );
    });

    test("should call 'onNotesEditStart' when edit is enabled", async () => {
      const [enableEditButton] = screen.getAllByRole("button");
      enableEditButton.click();
      await waitFor(() => expect(mockOnNotesEditStart).toHaveBeenCalled());
    });

    test("should submit note on edit by firing 'onNotesEditSave' and leave the edit mode", async () => {
      const [enableEditButton] = screen.getAllByRole("button");
      enableEditButton.click();

      const notesInput = screen.getByRole("textbox");
      userEvent.clear(notesInput);
      userEvent.type(notesInput, "Colourless green ideas sleep furiously");

      const [confirmButton] = screen.getAllByRole("button").slice(-1);
      confirmButton.click();

      await waitFor(() =>
        expect(mockOnNotesEditSave).toHaveBeenCalledWith(
          "Colourless green ideas sleep furiously"
        )
      );
      // The textbox should still be there after submit (edit mode is on)
      // until the 'onNoteEditSave' handler is resolved
      screen.getByRole("textbox");

      // Should eventually leave edit mode (after approx. 100 millis after 'mockOnNotesEditSave' has resolved)
      await waitFor(() => expect(screen.queryByRole("textbox")).toBeFalsy());
    });

    test("should reset form and leave edit mode on cancel button click", async () => {
      const [enableEditButton] = screen.getAllByRole("button");
      enableEditButton.click();

      const notesInput = screen.getByRole("textbox");
      userEvent.clear(notesInput);
      userEvent.type(notesInput, "some-other-note");
      await screen.findByText("some-other-note");

      const [cancelButton] = screen.getAllByRole("button").slice(-2);
      cancelButton.click();

      // Notes should be reset to initnial value
      screen.getByText("test-notes");
      expect(screen.queryByText("some-other-note")).toBeFalsy();
      // Should exit edit mode (no 'textarea' element)
      expect(screen.queryByRole("textbox")).toBeFalsy();
    });

    test("should reset form when switching off of edit mode using toggle edit button", async () => {
      const [toggleEditButton] = screen.getAllByRole("button");
      toggleEditButton.click();

      const notesInput = screen.getByRole("textbox");
      userEvent.clear(notesInput);
      userEvent.type(notesInput, "some-other-note");
      await screen.findByText("some-other-note");

      // Close the edit mode from outside (using toggle button)
      toggleEditButton.click();

      // Notes should be reset to initnial value
      screen.getByText("test-notes");
      expect(screen.queryByText("some-other-note")).toBeFalsy();
      // Should exit edit mode (no 'textarea' element)
      expect(screen.queryByRole("textbox")).toBeFalsy();
    });
  });
});
