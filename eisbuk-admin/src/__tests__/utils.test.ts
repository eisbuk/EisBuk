import { DateTime } from "luxon";

import { luxon2ISODate } from "eisbuk-shared";

import { capitalizeFirst, mode } from "@/utils/helpers";
import { isISODay } from "@/utils/date";

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

  describe("'mode' function", () => {
    test("should return member with highest occurrence", () => {
      const testArray = [1, 2, 2];
      expect(mode(testArray)).toEqual(2);
    });

    test("should return 'null' if two values have same number of occurrences", () => {
      const testArray = [1, 1, 2, 2];
      expect(mode(testArray)).toEqual(null);
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
});
