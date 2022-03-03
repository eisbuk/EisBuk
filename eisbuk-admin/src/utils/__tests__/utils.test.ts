/**
 * @jest-environment node
 */

import { DateTime } from "luxon";

import { luxon2ISODate } from "eisbuk-shared";

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

  describe("`comparePeriods` function", () => {
    test("should return earlier periods first", () => {
      let original = ["13:30-14:00", "13:00-13:30"];
      let expected = ["13:00-13:30", "13:30-14:00"];
      expect(original.sort(comparePeriods)).toEqual(expected);
      original = ["13:00-13:30", "12:30-13:00"];
      expected = ["12:30-13:00", "13:00-13:30"];
      expect(original.sort(comparePeriods)).toEqual(expected);
    });

    test("should return longer periods (starting at the same time) first", () => {
      let original = ["13:00-14:00", "13:00-14:30"];
      let expected = ["13:00-14:30", "13:00-14:00"];
      expect(original.sort(comparePeriods)).toEqual(expected);
      original = ["13:00-13:30", "13:00-14:00"];
      expected = ["13:00-14:00", "13:00-13:30"];
      expect(original.sort(comparePeriods)).toEqual(expected);
    });
  });
});
