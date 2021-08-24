import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateTime } from "luxon";

import NewSlotForm from "../NewSlotForm";

import {
  __startTimeErrorId__,
  __startTimeInputId__,
} from "../__testData__/testIds";

import { __noStartTimeError } from "@/lib/errorMessages";

describe("NewSlotForm", () => {
  describe("time validation", () => {
    /**
     * @Ivan : since we're writing tests to be as short as possible it makes sense to not add empty lines within "test" blocks.
     * This is just a personal preference, but imagine if you had a lot of "describe" blocks and "test" blocks.
     * This way the tests are kinda grouped visually.
     * @NOTE this is just a personal preference, but I think it makes sense
     */
    test("should print error message when startTime > endTime and vice versa", () => {
      // a dummy date we're using for tests
      const testDateISO = "2021-03-01";
      // a dummy date comverted to DateTime for easier processing
      const testDate = DateTime.fromISO(testDateISO);
      render(<NewSlotForm open={true} isoDate="2021-03-01" />);
      /**
       * @Ivan :
       * 1. Try and make the code as descriptive as possible: I would name this `errorOnScreen` instead of `test`, but any more desriptive name would work
       * 2. You should standardize as much as possible, thus test ids as constants
       */
      const test = screen.getByTestId(__startTimeErrorId__);
      userEvent.type(screen.getByTestId(__startTimeInputId__), "");
      /**
       * @Ivan :
       * I prefer `.toEqual` over `.toBe` as it does a deep comparison (two objects will be render `equal` even though they have different adress).
       * @NOTE Again, a personal preference and in this case both would work since you're testing for string (a primitive)
       */
      expect(test).toBe(__noStartTimeError);
      /**
       * @Ivan : A small note on the test, since you're not testing for specific element to have a specific value,
       * you can just do `screen.getByText(__noStartTimeError)`. This implicitly tests that the `__noStartTimeError` appeared on the screen,
       * and since it will appear on the screen only once in provided place, thare's no need for `.getByTestId()` and equal assertion.
       */
    });
  });
});
