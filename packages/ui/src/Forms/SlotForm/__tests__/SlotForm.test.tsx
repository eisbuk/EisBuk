import React from "react";
import { describe, afterEach, beforeEach, vi, test, expect } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  Category,
  DeprecatedCategory,
  fromISO,
  SlotType,
} from "@eisbuk/shared";
import i18n, {
  SlotFormTitle,
  SlotTypeLabel,
  CategoryLabel,
  SlotFormLabel,
  ActionButton,
  ValidationMessage,
  DateFormat,
} from "@eisbuk/translations";

import { testId } from "@eisbuk/testing/testIds";

import { defaultInterval, defaultSlotFormValues } from "../data";

import SlotForm from "../SlotForm";

import { testDate, testDateLuxon } from "@eisbuk/testing/date";
import { baseSlot } from "@eisbuk/testing/slots";

const baseProps = {
  date: testDate,
  onClose: () => {},
  onSubmit: () => {},
};

describe("SlotForm", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("Smoke test", () => {
    beforeEach(() => {
      render(<SlotForm {...baseProps} />);
    });

    test("should render \"New Slot\" title if no 'slotToEdit' passed in", () => {
      screen.getByText(i18n.t(SlotFormTitle.NewSlot) as string);
      screen.getByText(
        i18n.t(DateFormat.DayMonth, {
          date: testDateLuxon,
        }) as string
      );
    });

    test("should render all of the form fields", () => {
      // type field
      Object.values(SlotType).forEach((slotType) => {
        screen.getByText(i18n.t(SlotTypeLabel[slotType]) as string);
      });
      // categories field
      Object.values(Category).forEach((label) => {
        screen.getByText(i18n.t(CategoryLabel[label]) as string);
      });
      // intervals field
      screen.getByTestId(testId("time-interval-field"));
    });

    test("should render a deprecated categories for backwards compatibility, but disable them for selection", () => {
      Object.values(DeprecatedCategory).forEach((label) => {
        const checkbox = screen.getByLabelText(
          i18n.t(CategoryLabel[label]) as string
        );
        expect(checkbox).toHaveProperty("disabled", true);
      });
    });
  });

  describe("Test edit slot form", () => {
    // we're imlicitly testing that the `slotToEdit.date` will take presedence over `date` prop
    // and serve as assurance that the edit form will always have a date present
    const differentDate = "2020-01-01";
    const differentDateLuxon = fromISO("2020-01-01");

    test.only("should render \"Edit Slot\" title if 'slotToEdit' passed in", () => {
      render(
        <SlotForm
          {...baseProps}
          slotToEdit={{ ...baseSlot, date: differentDate }}
        />
      );
      screen.getByText(i18n.t(SlotFormTitle.EditSlot) as string);
      screen.getByText(
        i18n.t(DateFormat.DayMonth, {
          date: differentDateLuxon,
        }) as string
      );
    });
  });

  describe("Test interval fields", () => {
    beforeEach(() => {
      render(<SlotForm {...baseProps} />);
    });

    test("should render one field for empty form", () => {
      const intervalFields = screen.queryAllByTestId(
        testId("time-interval-field")
      );
      expect(intervalFields.length).toEqual(1);
    });

    test("should create a new interval field on 'Add New' button click", () => {
      screen.getByText(i18n.t(SlotFormLabel.AddInterval) as string).click();
      const intervalFields = screen.queryAllByTestId(
        testId("time-interval-field")
      );
      expect(intervalFields.length).toEqual(2);
    });

    test("should delete an interval field on 'Delete' button click", () => {
      act(() => screen.getByTestId(testId("delete-interval-button")).click());
      const intervalFields = screen.queryAllByTestId(
        testId("time-interval-field")
      );
      expect(intervalFields.length).toEqual(0);
    });
  });

  describe("Test dialog button actions", () => {
    const mockOnClose = vi.fn();
    const mockOnSubmit = vi.fn();

    /** @TODO_TEST This is broken and should be examined */
    test.skip("should call on submit with set values and close the form", async () => {
      render(
        <SlotForm
          {...baseProps}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // values for submit we're filling out as we go and expecting on submit
      let submitValues = {
        ...defaultSlotFormValues,
        intervals: {},
        date: testDate,
      };

      // select `adults` category
      screen
        .getByLabelText(i18n.t(CategoryLabel[Category.CourseAdults]) as string)
        .click();
      submitValues = {
        ...submitValues,
        categories: [Category.PreCompetitiveAdults],
      };

      // select slot type `ice`
      screen
        .getByLabelText(i18n.t(SlotTypeLabel[SlotType.Ice]) as string)
        .click();
      submitValues = { ...submitValues, type: SlotType.Ice };

      // fill interval
      const [startTime1, endTime1] = screen.getAllByRole("textbox");
      userEvent.type(startTime1, "15:00");
      userEvent.type(endTime1, "16:30");

      submitValues = {
        ...submitValues,
        intervals: { "15:00-16:30": { startTime: "15:00", endTime: "16:30" } },
      };

      // add new (default) interval
      screen.getByText(i18n.t(SlotFormLabel.AddInterval) as string).click();

      // submit form
      screen.getByText(i18n.t(ActionButton.Save) as string).click();
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          ...submitValues,
          intervals: {
            ...submitValues.intervals,
            [`${defaultInterval.startTime}-${defaultInterval.endTime}`]:
              defaultInterval,
          },
        });
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    test("should call 'onClose' on cancel button click", () => {
      render(<SlotForm {...baseProps} onClose={mockOnClose} />);
      screen.getByText(i18n.t(ActionButton.Cancel) as string).click();
      expect(mockOnClose).toHaveBeenCalled();
    });

    test("should submit slot with updated fields, if 'slotToEdit' passed in", async () => {
      render(
        <SlotForm
          {...baseProps}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          slotToEdit={baseSlot}
        />
      );
      // trigger submit
      screen.getByText(i18n.t(ActionButton.Save) as string).click();
      await waitFor(() =>
        expect(mockOnSubmit).toHaveBeenCalledWith({ ...baseSlot })
      );
    });

    test("should submit updated slot with deleted interval if interval deleted", async () => {
      const wantIntervals = {
        "10:00-11:00": {
          startTime: "10:00",
          endTime: "11:00",
        },
      };
      const intervals = {
        "09:00-10:00": {
          startTime: "09:00",
          endTime: "10:00",
        },
        ...wantIntervals,
      };
      render(
        <SlotForm
          {...baseProps}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          slotToEdit={{ ...baseSlot, intervals }}
        />
      );
      // delete first interval
      screen.getAllByTestId(testId("delete-interval-button"))[0].click();
      // trigger submit
      screen.getByText(i18n.t(ActionButton.Save) as string).click();
      await waitFor(() =>
        expect(mockOnSubmit).toHaveBeenCalledWith({
          ...baseSlot,
          intervals: wantIntervals,
        })
      );
    });
  });

  describe("Test validation errors", () => {
    beforeEach(() => {
      render(<SlotForm {...baseProps} />);
    });

    test("should show error if no categories are selected", async () => {
      screen.getByText(i18n.t(ActionButton.Save) as string).click();
      await screen.findByText(
        i18n.t(ValidationMessage.RequiredEntry) as string
      );
    });

    test("should show error if time input empty", async () => {
      const [startTime] = screen.getAllByRole("textbox");
      fireEvent.change(startTime, { target: { value: "" } });
      screen.getByText(i18n.t(ActionButton.Save) as string).click();
      await screen.findByText(
        i18n.t(ValidationMessage.RequiredField) as string
      );
    });

    test('should show error if one of the time input doesn\'t follow"HH:mm" format', async () => {
      const [startTime] = screen.getAllByRole("textbox");
      userEvent.type(startTime, "not_time_string");
      screen.getByText(i18n.t(ActionButton.Save) as string).click();
      await screen.findByText(i18n.t(ValidationMessage.InvalidTime) as string);
    });

    test("should show error if startTime > endTime", async () => {
      const [startTime, endTime] = screen.getAllByRole("textbox");
      fireEvent.change(startTime, { target: { value: "15:00" } });
      fireEvent.change(endTime, { target: { value: "07:00" } });
      screen.getByText(i18n.t(ActionButton.Save) as string).click();
      await screen.findByText(i18n.t(ValidationMessage.TimeMismatch) as string);
    });
  });
});
