import React from "react";
import { screen, render, waitFor } from "@testing-library/react";

import NotesSection from "../NotesSection";
import userEvent from "@testing-library/user-event";

describe("IntervalCard", () => {
  describe("Test notes section", () => {
    test("should display 'notes', but disable edit and action buttons if not 'isEditing'", () => {
      const notes = "some-notes";
      render(<NotesSection {...{ notes }} />);

      screen.getByText("some-notes");
      expect(screen.queryByRole("textbox")).toBeFalsy();

      const actionButtons = screen.getAllByRole("button");
      actionButtons.forEach((b) => expect(b).toHaveProperty("disabled", true));
    });

    test("should enable edit and call appropriate action handler for button", async () => {
      const notes = "Colourless green ideas";
      const mockOnCancel = jest.fn();
      const mockOnSave = jest.fn();

      render(
        <NotesSection
          {...{ notes }}
          isEditing
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const notesInput = screen.getByRole("textbox");
      userEvent.type(notesInput, " sleep furiously");

      const [, confirmButton] = screen.getAllByRole("button");

      jest.clearAllMocks();

      confirmButton.click();
      await waitFor(() =>
        expect(mockOnSave).toHaveBeenCalledWith(
          "Colourless green ideas sleep furiously"
        )
      );
    });

    test("should call 'onCancel' and reset form on cancel button click", async () => {
      const notes = "test-notes";
      const mockOnCancel = jest.fn();

      render(<NotesSection onCancel={mockOnCancel} isEditing {...{ notes }} />);
      screen.getByText("test-notes");

      const notesInput = screen.getByRole("textbox");
      userEvent.clear(notesInput);
      await waitFor(() => {
        expect(screen.queryByText("test-notes")).toBeFalsy();
      });

      const [cancelButton] = screen.getAllByRole("button");

      cancelButton.click();
      expect(mockOnCancel).toHaveBeenCalled();
      // "test-notes" should be displayed on screen as the for has been reset
      screen.getByText("test-notes");
    });
  });
});
