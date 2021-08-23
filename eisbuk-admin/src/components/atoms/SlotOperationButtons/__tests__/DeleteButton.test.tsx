/**
 * @jest-envirnoment jsdom-sixteen
 */
import React from "react";
import {
  screen,
  render,
  waitForElementToBeRemoved,
  cleanup,
} from "@testing-library/react";
import { DateTime } from "luxon";

import SlotOperationButtons from "../SlotOperationButtons";
import DeleteButton from "../DeleteButton";

import {
  __noDateProvidedError,
  __slotButtonNoContextError,
} from "@/lib/errorMessages";

// import * as slotActions from "@/store/actions/slotOperations";

import { __deleteButtonId__ } from "../__testData__/testIds";
import {
  __slotFormId__,
  __cancelFormId__,
  // __confirmFormId__,
  // __offIceDancingButtonId__,
} from "@/__testData__/testIds";

const mockDispatch = jest.fn();

jest.mock("react-redux", () => ({
  /** @TODO Remove this when we update SlotForm to be more atomic  */
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

  //   describe("'DeleteButton' functionality test", () => {
  //     // this is a dummy date of no significance for the tests
  //     // provided in order to render properly (as it's a requirement)
  //     const dummyDate = DateTime.fromISO("2021-03-01");

  //     beforeEach(() => {
  //       render(
  //         <SlotOperationButtons date={dummyDate}>
  //           <DeleteButton />
  //         </SlotOperationButtons>
  //       );
  //     });

  //     test("should open 'SlotForm' on click", () => {
  //       const formOnScreen = screen.queryByTestId(__slotFormId__);
  //       // should not appear on screen at first
  //       expect(formOnScreen).toEqual(null);
  //       screen.getByTestId(__deleteButtonId__).click();
  //       screen.getByTestId(__slotFormId__);
  //     });

  //     test("should close 'SlotForm' on forms 'onClose' trigger", async () => {
  //       // open form
  //       screen.getByTestId(__deleteButtonId__).click();
  //       // should close form
  //       screen.getByTestId(__cancelFormId__).click();
  //       await waitForElementToBeRemoved(() =>
  //         screen.queryByTestId(__slotFormId__)
  //       );
  //     });
  //   });

  describe("'DeleteButton' edge cases/error handling test", () => {
    const spyConsoleError = jest.spyOn(console, "error");

    test("should not render the button and should log error to console if not under 'SlotOperationButtons' context", () => {
      render(<DeleteButton />);
      const buttonOnScreen = screen.queryByTestId(__deleteButtonId__);
      expect(buttonOnScreen).toEqual(null);
      expect(spyConsoleError).toHaveBeenCalledWith(__slotButtonNoContextError);
    });

    test("should not render the button and should log error to console if within 'contextType = \"slot\"' has been provided in the context", () => {
      render(
        <SlotOperationButtons>
          <DeleteButton />
        </SlotOperationButtons>
      );
      const buttonOnScreen = screen.queryByTestId(__deleteButtonId__);
      expect(buttonOnScreen).toEqual(null);
      expect(spyConsoleError).toHaveBeenCalledWith(__noDateProvidedError);
    });
  });
});
