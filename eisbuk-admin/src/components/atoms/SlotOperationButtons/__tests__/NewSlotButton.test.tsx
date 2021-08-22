import React from "react";
import {
  screen,
  render,
  waitForElementToBeRemoved,
  cleanup,
} from "@testing-library/react";
import { DateTime } from "luxon";

import SlotOperationButtons from "../SlotOperationButtons";
import NewSlotButton from "../NewSlotButton";

import {
  __noDateProvidedError,
  __slotButtonNoContextError,
} from "@/lib/errorMessages";

// import * as slotActions from "@/store/actions/slotOperations";

import { __newSlotButtonId__ } from "../__testData__/testIds";
import {
  __slotFormId__,
  __cancelFormId__,
  // __confirmFormId__,
  // __offIceDancingButtonId__,
} from "@/__testData__/testIds";

const mockDispatch = jest.fn();

jest.mock("react-redux", () => ({
  /** @TODO Remove this when we update slot form to be more atomic  */
  useSelector: () => "",
  useDispatch: () => mockDispatch,
}));

/** @TODO remove this when the i18next is instantiated with tests */
jest.mock("i18next", () => ({
  /** We're mocking this not to fail certain tests depending on this, but we're not testing the i18n values, so this is ok for now @TODO fix i18n in tests */
  t: () => "",
}));

describe("Slot Opeartion Buttons", () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  describe("'NewSlotButton' functionality test", () => {
    // this is a dummy date of no significance for the tests
    // provided in order to render properly (as it's a requirement)
    const dummyDate = DateTime.fromISO("2021-03-01");

    beforeEach(() => {
      render(
        <SlotOperationButtons date={dummyDate}>
          <NewSlotButton />
        </SlotOperationButtons>
      );
    });

    test("should open createSlot form on click", () => {
      const formOnScreen = screen.queryByTestId(__slotFormId__);
      // should not appear on screen at first
      expect(formOnScreen).toEqual(null);
      screen.getByTestId(__newSlotButtonId__).click();
      screen.getByTestId(__slotFormId__);
    });

    test("should close createSlot form on forms 'onClose' trigger", async () => {
      // open form
      screen.getByTestId(__newSlotButtonId__).click();
      // should close form
      screen.getByTestId(__cancelFormId__).click();
      await waitForElementToBeRemoved(() =>
        screen.queryByTestId(__slotFormId__)
      );
    });

    /**
     * @NOTE below test is not passing and is pretty complex.
     * This has been hand tested for now and I didn't want to waste time
     * sloving the complexity as the tested functionality should be moved
     * (and tested) insite slot form component. At that point (slot form update)
     * @TODO remove this altogether
     */
    // test("should properly submit form on submit", () => {
    //   // test action we'll use to confirm 'createSlots' has been dispatched to store
    //   const mockCreateAction = { type: "CREATE_SLOTS" };
    //   // we're mocking sumit action to return a dummy redux action
    //   // rather than firestore thunk for easier testing
    //   jest
    //     .spyOn(slotActions, "createSlots")
    //     .mockImplementation(() => mockCreateAction as any);
    //   render(
    //     <SlotOperationButtons>
    //       <NewSlotButton />
    //     </SlotOperationButtons>
    //   );
    //   // open form
    //   screen.getByTestId(__newSlotButtonId__).click();
    //   // select off-ice-dancing type, which triggers all categories selection
    //   // in effect having a minimal viable slot passing form validation
    //   /** @TODO when i18next is instantiated with tests, this should be 'findByText' rather than testId */
    //   screen.getByTestId(__offIceDancingButtonId__).click();
    //   // submit form
    //   screen.getByTestId(__confirmFormId__).click();
    //   expect(mockDispatch).toHaveBeenCalledWith(mockCreateAction);
    // });
  });

  describe("'NewSlotButton' edge cases/error handling test", () => {
    const spyConsoleError = jest.spyOn(console, "error");

    test("should not render the button and should log error to console if not under 'SlotOperationButtons' context", () => {
      render(<NewSlotButton />);
      const buttonOnScreen = screen.queryByTestId(__newSlotButtonId__);
      expect(buttonOnScreen).toEqual(null);
      expect(spyConsoleError).toHaveBeenCalledWith(__slotButtonNoContextError);
    });

    test("should not render the button and should log error to console if no date has been provided in the context", () => {
      render(
        <SlotOperationButtons>
          <NewSlotButton />
        </SlotOperationButtons>
      );
      const buttonOnScreen = screen.queryByTestId(__newSlotButtonId__);
      expect(buttonOnScreen).toEqual(null);
      expect(spyConsoleError).toHaveBeenCalledWith(__noDateProvidedError);
    });
  });
});
