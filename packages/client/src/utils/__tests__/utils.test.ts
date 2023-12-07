import { describe, expect, test } from "vitest";
/**
 * @vitest-environment node
 */

import { DateTime } from "luxon";

import { luxon2ISODate, calculateIntervalDuration } from "@eisbuk/shared";

import { capitalizeFirst, getOrgFromLocation, isEmpty } from "../helpers";
import { isISODay, generateDatesInRange } from "../date";

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

  describe("`convertIntervalToNum` function", () => {
    test("should convert null to 0", () => {
      const interval = null;
      const result = calculateIntervalDuration(interval);
      expect(result).toBe(0);
    });

    test("should convert string to number", () => {
      const halfStr = "21:00 - 21:20";
      const oneStr = "16:00 - 17:00";
      const oneHalfStr = "22:00 - 23:30";
      const twoStr = "22:00 - 24:00";
      const nonStdStr = "22:20 - 24:00";

      // const morningResult = convertIntervalToNum(morningStr);
      const oneResult = calculateIntervalDuration(oneStr);
      const oneHalfResult = calculateIntervalDuration(oneHalfStr);
      const halfResult = calculateIntervalDuration(halfStr);
      const twoResult = calculateIntervalDuration(twoStr);
      const nonStdResult = calculateIntervalDuration(nonStdStr);

      expect(halfResult).toBe(0.5);
      expect(oneResult).toBe(1);
      expect(oneHalfResult).toBe(1.5);
      expect(twoResult).toBe(2);
      expect(nonStdResult).toBe(2);
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

  describe("`generateDatesInRange` function", () => {
    test("should return a generator that yields all date strings within a range", () => {
      const start = DateTime.fromISO("2022-09-01");
      const end = start.plus({ week: 1 });

      const dates = Array.from(generateDatesInRange(start, end));

      expect(dates.length).toBe(7);
      expect(dates[6]).toBe("2022-09-07");
    });
  });
});
