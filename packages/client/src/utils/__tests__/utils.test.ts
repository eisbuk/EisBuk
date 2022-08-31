/**
 * @jest-environment node
 */

import { DateTime } from "luxon";

import { luxon2ISODate } from "@eisbuk/shared";

import {
  capitalizeFirst,
  getOrgFromLocation,
  isEmpty,
  comparePeriods,
} from "../helpers";
import { isISODay } from "../date";

describe("Helpers", () => {
  describe("`capitalizeFirst` function", () => {
    test("should return passed string, with first letter capitalized", () => {
      const str = "helloworld";
      const want = "Helloworld";
      expect(capitalizeFirst(str)).toEqual(want);
    });

    test("should capitalize all of the first letters for words divided by '-' sign", () => {
      const str = "hello-world";
      const want = "Hello-World";
      expect(capitalizeFirst(str)).toEqual(want);
    });
  });
});

describe("Date utils", () => {
  describe("'luxon2ISODate' function", () => {
    test("should return ISO date string with only date part (excluding time of day) from luxon date", () => {
      const testISO = "2021-01-01";
      // create a DateTime format (including time of day) of `testISO`
      const testLuxonDate = DateTime.fromISO(testISO); // '2021-01-01T00:00:00.000Z'
      // result should be equal to `testISO` (without the added time of day)
      const resDate = luxon2ISODate(testLuxonDate);
      expect(resDate).toEqual(testISO);
    });
  });

  describe("'isISO' function", () => {
    test("should return 'true' if passed sring is a valid ISO date (yyyy-mm-dd) and 'false' otherwise", () => {
      expect(isISODay("2021-01-01")).toEqual(true);
      expect(isISODay("no-an-iso")).toEqual(false);
      // we want a valid ISO day (yyyy-mm-dd), while this is a valid ISO date, it should return `false`
      expect(isISODay("2021-01")).toEqual(false);
    });
  });

  describe("getOrgFromLocation", () => {
    test("should split on the first double dash and return the first part", async () => {
      expect(getOrgFromLocation("no-double-dashes.web.app")).toEqual(
        "no-double-dashes.web.app"
      );
      expect(getOrgFromLocation("one--double-dash-randomhash.web.app")).toEqual(
        "one.web.app"
      );
      expect(
        getOrgFromLocation("two--double--dashes-randomhash.web.app")
      ).toEqual("two.web.app");
    });
  });

  describe("isEmpty", () => {
    test("should return false on all defined, non-null primitive values", async () => {
      expect(isEmpty("string")).toEqual(false);
      expect(isEmpty("")).toEqual(false);
      expect(isEmpty(20)).toEqual(false);
      expect(isEmpty(0)).toEqual(false);
      expect(isEmpty(true)).toEqual(false);
      expect(isEmpty(false)).toEqual(false);
    });

    test("should return true on null and undefined", async () => {
      expect(isEmpty(null)).toEqual(true);
      expect(isEmpty(undefined)).toEqual(true);
    });

    test("should return true empty arrays and objects and false on non-empty ones", async () => {
      expect(isEmpty([])).toEqual(true);
      expect(isEmpty({})).toEqual(true);

      expect(isEmpty(["element"])).toEqual(false);
      expect(isEmpty({ foo: "bar" })).toEqual(false);
    });
  });

  describe("`comparePeriods` function", () =>
    comparePeriodsTableTests([
      {
        name: "should return earlier periods first",
        input: ["13:30-14:00", "12:30-13:00", "13:00-13:30"],
        want: ["12:30-13:00", "13:00-13:30", "13:30-14:00"],
      },
      {
        name: "should return longer periods first",
        input: ["13:00-14:00", "13:00-14:30", "13:00-13:30"],
        want: ["13:00-14:30", "13:00-14:00", "13:00-13:30"],
      },
      {
        name: "start time should take presedence over interval length",
        input: ["13:30-15:00", "12:30-13:30", "12:00-12:30"],
        want: ["12:00-12:30", "12:30-13:30", "13:30-15:00"],
      },
      {
        name: "should not explode when sorting two equal periods",
        input: ["13:00-15:00", "12:00-14:00", "13:00-15:00"],
        want: ["12:00-14:00", "13:00-15:00", "13:00-15:00"],
      },
    ]));

  test("Edge case: should return 0 if periods are the same (this will be used for composition of compare functions)", () => {
    expect(comparePeriods("12:00", "12:00")).toEqual(0);
  });
});

interface ComparePeriodsTest {
  name: string;
  input: string[];
  want: string[];
}

/** Table test func */
function comparePeriodsTableTests(tests: ComparePeriodsTest[]) {
  tests.forEach(({ name, input, want }) => {
    test(name, () => {
      expect(input.sort(comparePeriods)).toEqual(want);
    });
  });
}
