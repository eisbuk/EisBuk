import React from "react";
import {
  cleanup,
  render,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import { DateTime } from "luxon";
import userEvent from "@testing-library/user-event";

import { Category, SlotType, luxon2ISODate } from "eisbuk-shared";

import { defaultInterval, defaultSlotFormValues } from "@/lib/data";
import {
  __newSlotTitle__,
  __editSlotTitle__,
  slotTypeLabel,
  categoryLabel,
  __addNewInterval__,
  __createSlot__,
  __cancel__,
  __editSlot__,
  ValidationMessage,
} from "@/lib/labels";

import SlotForm from "../SlotForm";

import * as slotOperations from "@/store/actions/slotOperations";

import { testWithMutationObserver } from "@/__testUtils__/envUtils";

import {
  __timeIntervalFieldId__,
  __deleteIntervalId__,
} from "../__testData__/testIds";
import { dummySlot, dummySlotFormValues } from "../__testData__/dummyData";
import { __slotFormId__ } from "@/__testData__/testIds";
import { testDate } from "@/__testData__/date";

/**
 * We're mocking `i18next.t` function to return easily testable string for all calls
 */
const mockT = jest.fn();
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: mockT }),
}));
mockT.mockImplementation((string: string, options?: { date?: DateTime }) => {
  const isoDay = options?.date ? luxon2ISODate(options.date) : undefined;
  return isoDay ? `${string} ${isoDay}` : string;
});

/**
 * We need slot create and update actions to be dispatched as thunks,
 * so we want to test them being dispatched, rather than called
 */
jest.mock("react-redux", () => ({ useDispatch: () => mockDispatch }));
const mockDispatch = jest.fn();

const baseProps = { date: testDate, onClose: () => {}, open: true };

describe("SlotForm ->", () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  describe("Smoke test ->", () => {
    beforeEach(() => {
      render(<SlotForm {...baseProps} />);
    });

    /** @TEMP This is temporarily skipped until we instantiate `i18next` with tests */
    xtest("should render \"New Slot\" title if no 'slotToEdit' passed in", () => {
      // a test string we'll be using to test the title, this isn't actual form the string will be presented in
      const titleString = `${__newSlotTitle__} ${testDate}`;
      screen.getByText(titleString);
    });

    test("should render all of the form fields", () => {
      // type field
      Object.values(slotTypeLabel).forEach((slotType) => {
        screen.getByText(slotType);
      });
      // categories field
      Object.values(categoryLabel).forEach((label) => {
        screen.getByText(label);
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

    beforeEach(() => {
      render(
        <SlotForm
          {...baseProps}
          slotToEdit={{ ...dummySlot, date: differentDate }}
        />
      );
    });

    /** @TEMP This is temporarily skipped until we instantiate `i18next` with tests */
    xtest("should render \"Edit Slot\" title if 'slotToEdit' passed in", () => {
      // a test string we'll be using to test the title, this isn't actual form the string will be presented in
      const titleString = `${__editSlotTitle__} ${differentDate}`;
      screen.getByText(titleString);
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
      screen.getByText(__addNewInterval__).click();
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

    testWithMutationObserver(
      "should call on submit with set values and close the form",
      async () => {
        render(<SlotForm {...baseProps} onClose={mockOnClose} />);
        // values for submit we're filling out as we go and expecting on submit
        let submitValues = {
          ...defaultSlotFormValues,
          date: testDate,
        };
        // select `adults` category
        screen.getByText(categoryLabel[Category.Adults]).click();
        submitValues = { ...submitValues, categories: [Category.Adults] };
        // select slot type `ice`
        screen.getByText(slotTypeLabel[SlotType.Ice]).click();
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
        screen.getByText(__addNewInterval__).click();
        submitValues = {
          ...submitValues,
          intervals: [...submitValues.intervals, defaultInterval],
        };
        // submit form
        screen.getByText(__createSlot__).click();
        // create mock action for form submission
        const mockCreateAction = mockCreateImplementation(submitValues);
        await waitFor(() => {
          expect(mockDispatch).toHaveBeenCalledWith(mockCreateAction);
          expect(mockOnClose).toHaveBeenCalled();
        });
      }
    );

    test("should call 'onClose' on cancel button click", () => {
      render(<SlotForm {...baseProps} onClose={mockOnClose} />);
      screen.getByText(__cancel__).click();
      expect(mockOnClose).toHaveBeenCalled();
    });

    testWithMutationObserver(
      "should call 'updateSlot' on submit, if passed 'slotToEdit'",
      async () => {
        render(
          <SlotForm
            {...baseProps}
            onClose={mockOnClose}
            slotToEdit={dummySlot}
          />
        );
        // trigger submit
        screen.getByText(__editSlot__).click();
        // create mock action for form submission
        const mockUpdateAction = mockUpdateImplementation({
          ...dummySlotFormValues,
          date: testDate,
          id: dummySlot.id,
        });
        await waitFor(() =>
          expect(mockDispatch).toHaveBeenCalledWith(mockUpdateAction)
        );
      }
    );

    testWithMutationObserver(
      "should update slot with deleted interval (if any)",
      async () => {
        render(
          <SlotForm
            {...baseProps}
            onClose={mockOnClose}
            slotToEdit={dummySlot}
          />
        );
        // delete first interval
        screen.getAllByTestId(__deleteIntervalId__)[0].click();
        // trigger submit
        screen.getByText(__editSlot__).click();
        // create mock action for form submission
        const mockUpdateAction = mockUpdateImplementation({
          ...dummySlotFormValues,
          date: testDate,
          id: dummySlot.id,
          intervals: [dummySlotFormValues.intervals[1]],
        });
        await waitFor(() =>
          expect(mockDispatch).toHaveBeenCalledWith(mockUpdateAction)
        );
      }
    );
  });

  describe("Test validation errors ->", () => {
    beforeEach(() => {
      render(<SlotForm {...baseProps} />);
    });

    testWithMutationObserver(
      "should show error if no categories are selected",
      async () => {
        screen.getByText(__createSlot__).click();
        await screen.findByText(ValidationMessage.RequiredEntry);
      }
    );

    testWithMutationObserver(
      "should show error if time input empty",
      async () => {
        const [startTime] = screen.getAllByRole("textbox");
        fireEvent.change(startTime, { target: { value: "" } });
        await screen.findByText(ValidationMessage.RequiredField);
      }
    );

    testWithMutationObserver(
      'should show error if one of the time input doesn\'t follow "HH:mm" format',
      async () => {
        const [startTime] = screen.getAllByRole("textbox");
        userEvent.type(startTime, "not_time_string");
        await screen.findByText(ValidationMessage.InvalidTime);
      }
    );

    testWithMutationObserver(
      "should show error if startTime > endTime",
      async () => {
        const [startTime, endTime] = screen.getAllByRole("textbox");
        userEvent.type(startTime, "15:00");
        userEvent.type(endTime, "07:00");
        await screen.findByText(ValidationMessage.TimeMismatch);
      }
    );
  });
});
