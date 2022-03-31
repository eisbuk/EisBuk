/**
 * @jest-environment jsdom
 */

import React from "react";
import {
  cleanup,
  render,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Category, fromISO, SlotType } from "@eisbuk/shared";
import i18n, {
  SlotFormTitle,
  SlotTypeLabel,
  CategoryLabel,
  SlotFormLabel,
  ActionButton,
  ValidationMessage,
  DateFormat,
} from "@eisbuk/translations";

import { defaultInterval, defaultSlotFormValues } from "@/lib/data";

import SlotForm from "../SlotForm";

import * as slotOperations from "@/store/actions/slotOperations";

import {
  __timeIntervalFieldId__,
  __deleteIntervalId__,
} from "../__testData__/testIds";
import { __slotFormId__ } from "@/__testData__/testIds";
import { testDate, testDateLuxon } from "@/__testData__/date";
import { slotToFormValues } from "../utils";
import { baseSlot } from "@/__testData__/slots";

/**
 * We need slot create and update actions to be dispatched as thunks,
 * so we want to test them being dispatched, rather than called
 */
jest.mock("react-redux", () => ({ useDispatch: () => mockDispatch }));
const mockDispatch = jest.fn();

const baseProps = { date: testDate, onClose: () => {}, open: true };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { date: __date, ...testFormValues } = slotToFormValues(baseSlot)!;

// commonly used translations
const createSlotLabel = i18n.t(ActionButton.CreateSlot) as string;

xdescribe("SlotForm ->", () => {
  /** @TODO Check up */
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  describe("Smoke test ->", () => {
    beforeEach(() => {
      render(<SlotForm {...baseProps} />);
    });

    test("should render \"New Slot\" title if no 'slotToEdit' passed in", () => {
      // a test string we'll be using to test the title, this isn't actual form the string will be presented in
      const newSlotTitle = `${i18n.t(SlotFormTitle.NewSlot)} ( ${i18n.t(
        DateFormat.DayMonth,
        {
          date: testDateLuxon,
        }
      )} )`;
      screen.getByText(newSlotTitle);
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
      screen.getByTestId(__timeIntervalFieldId__);
    });

    test("should not render of 'open = false'", () => {
      // verify slot form id is being used
      screen.getByTestId(__slotFormId__);
      cleanup();
      // run the actual test
      render(<SlotForm {...baseProps} open={false} />);
      expect(screen.queryByTestId(__slotFormId__)).toEqual(null);
    });
  });

  describe("Test edit slot form ->", () => {
    // we're imlicitly testing that the `slotToEdit.date` will take presedence over `date` prop
    // and serve as assurance that the edit form will always have a date present
    const differentDate = "2020-01-01";
    const differentDateLuxon = fromISO("2020-01-01");

    test("should render \"Edit Slot\" title if 'slotToEdit' passed in", () => {
      render(
        <SlotForm
          {...baseProps}
          slotToEdit={{ ...baseSlot, date: differentDate }}
        />
      );
      screen.getByText(
        `${i18n.t(SlotFormTitle.EditSlot)} ( ${i18n.t(DateFormat.DayMonth, {
          date: differentDateLuxon,
        })} )`
      );
    });
  });

  describe("Test interval fields ->", () => {
    beforeEach(() => {
      render(<SlotForm {...baseProps} />);
    });

    test("should render one field for empty form", () => {
      const intervalFields = screen.queryAllByTestId(__timeIntervalFieldId__);
      expect(intervalFields.length).toEqual(1);
    });

    test("should create a new interval field on 'Add New' button click", () => {
      screen.getByText(i18n.t(SlotFormLabel.AddInterval) as string).click();
      const intervalFields = screen.queryAllByTestId(__timeIntervalFieldId__);
      expect(intervalFields.length).toEqual(2);
    });

    test("should delete an interval field on 'Delete' button click", () => {
      screen.getByTestId(__deleteIntervalId__).click();
      const intervalFields = screen.queryAllByTestId(__timeIntervalFieldId__);
      expect(intervalFields.length).toEqual(0);
    });
  });

  describe("Test dialog button actions ->", () => {
    // we're creating mockImplementations for create/update slots to be
    // identity functions rather than thunks for easier testing of dispatching the correct functions
    const mockCreateImplementation = (
      payload: Parameters<typeof slotOperations.createNewSlot>[0]
    ) => payload;
    const mockUpdateImplementation = (
      payload: Parameters<typeof slotOperations.updateSlot>[0]
    ) => payload;

    // mock implementation of slot operations to identity functions delcared above (for easier testing)
    jest
      .spyOn(slotOperations, "createNewSlot")
      .mockImplementation(mockCreateImplementation as any);
    jest
      .spyOn(slotOperations, "updateSlot")
      .mockImplementation(mockUpdateImplementation as any);

    const mockOnClose = jest.fn();

    test("should call on submit with set values and close the form", async () => {
      render(<SlotForm {...baseProps} onClose={mockOnClose} />);
      // values for submit we're filling out as we go and expecting on submit
      let submitValues = {
        ...defaultSlotFormValues,
        date: testDate,
      };
      // select `adults` category
      screen
        .getByText(i18n.t(CategoryLabel[Category.Adults]) as string)
        .click();
      submitValues = { ...submitValues, categories: [Category.Adults] };
      // select slot type `ice`
      screen.getByText(i18n.t(SlotTypeLabel[SlotType.Ice]) as string).click();
      submitValues = { ...submitValues, type: SlotType.Ice };
      // fill interval
      const [startTime1, endTime1] = screen.getAllByRole("textbox");
      await userEvent.type(startTime1, "15:00");
      await userEvent.type(endTime1, "16:30");
      submitValues = {
        ...submitValues,
        intervals: [{ startTime: "15:00", endTime: "16:30" }],
      };
      // add new (default) interval
      screen.getByText(i18n.t(SlotFormLabel.AddInterval) as string).click();
      submitValues = {
        ...submitValues,
        intervals: [...submitValues.intervals, defaultInterval],
      };
      // submit form
      screen.getByText(createSlotLabel).click();
      // create mock action for form submission
      const mockCreateAction = mockCreateImplementation(submitValues);
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(mockCreateAction);
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    test("should call 'onClose' on cancel button click", () => {
      render(<SlotForm {...baseProps} onClose={mockOnClose} />);
      screen.getByText(i18n.t(ActionButton.Cancel) as string).click();
      expect(mockOnClose).toHaveBeenCalled();
    });

    test("should call 'updateSlot' on submit, if passed 'slotToEdit'", async () => {
      render(
        <SlotForm {...baseProps} onClose={mockOnClose} slotToEdit={baseSlot} />
      );
      // trigger submit
      screen.getByText(i18n.t(ActionButton.EditSlot) as string).click();
      // create mock action for form submission
      const mockUpdateAction = mockUpdateImplementation({
        ...testFormValues,
        date: testDate,
        id: baseSlot.id,
      });
      await waitFor(() =>
        expect(mockDispatch).toHaveBeenCalledWith(mockUpdateAction)
      );
    });

    test("should update slot with deleted interval (if any)", async () => {
      render(
        <SlotForm {...baseProps} onClose={mockOnClose} slotToEdit={baseSlot} />
      );
      // delete first interval
      screen.getAllByTestId(__deleteIntervalId__)[0].click();
      // trigger submit
      screen.getByText(i18n.t(ActionButton.EditSlot) as string).click();
      // create mock action for form submission
      const mockUpdateAction = mockUpdateImplementation({
        ...testFormValues,
        date: testDate,
        id: baseSlot.id,
        intervals: testFormValues.intervals.filter((_, i) => i !== 0),
      });
      await waitFor(() =>
        expect(mockDispatch).toHaveBeenCalledWith(mockUpdateAction)
      );
    });
  });

  describe("Test validation errors ->", () => {
    beforeEach(() => {
      render(<SlotForm {...baseProps} />);
    });

    test("should show error if no categories are selected", async () => {
      screen.getByText(createSlotLabel).click();
      await screen.findByText(
        i18n.t(ValidationMessage.RequiredEntry) as string
      );
    });

    test("should show error if time input empty", async () => {
      const [startTime] = screen.getAllByRole("textbox");
      fireEvent.change(startTime, { target: { value: "" } });
      screen.getByText(createSlotLabel).click();
      await screen.findByText(
        i18n.t(ValidationMessage.RequiredField) as string
      );
    });

    test('should show error if one of the time input doesn\'t follow "HH:mm" format', async () => {
      const [startTime] = screen.getAllByRole("textbox");
      userEvent.type(startTime, "not_time_string");
      screen.getByText(createSlotLabel).click();
      await screen.findByText(i18n.t(ValidationMessage.InvalidTime) as string);
    });

    test("should show error if startTime > endTime", async () => {
      const [startTime, endTime] = screen.getAllByRole("textbox");
      userEvent.type(startTime, "15:00");
      userEvent.type(endTime, "07:00");
      screen.getByText(createSlotLabel).click();
      await screen.findByText(i18n.t(ValidationMessage.TimeMismatch) as string);
    });
  });
});
