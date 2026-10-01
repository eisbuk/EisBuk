import { describe, test, expect } from "vitest";

import { getIntervalMinutes } from "../slots";

describe("Slot utils", () => {
  describe("getIntervalMinutes", () => {
    test("should return the exact duration in minutes, without rounding", () => {
      expect(getIntervalMinutes("16:10-17:00")).toEqual(50);
      expect(getIntervalMinutes("16:00-17:50")).toEqual(110);
      expect(getIntervalMinutes("21:00-22:15")).toEqual(75);
      expect(getIntervalMinutes("09:00-09:20")).toEqual(20);
    });

    test("should accept spaces around the separator and single digit hours", () => {
      expect(getIntervalMinutes("16:00 - 17:00")).toEqual(60);
      expect(getIntervalMinutes("9:00-10:30")).toEqual(90);
    });

    test("should accept '24:00' as the end of the day", () => {
      expect(getIntervalMinutes("22:00-24:00")).toEqual(120);
    });

    test("should return null for a missing interval", () => {
      expect(getIntervalMinutes(null)).toBeNull();
      expect(getIntervalMinutes(undefined)).toBeNull();
      expect(getIntervalMinutes("")).toBeNull();
    });

    test("should return null for a malformed interval", () => {
      expect(getIntervalMinutes("16:00")).toBeNull();
      expect(getIntervalMinutes("16-17")).toBeNull();
      expect(getIntervalMinutes("16:00-17:00-18:00")).toBeNull();
      expect(getIntervalMinutes("ab:cd-ef:gh")).toBeNull();
      expect(getIntervalMinutes("16:00-25:00")).toBeNull();
      expect(getIntervalMinutes("16:60-17:00")).toBeNull();
      expect(getIntervalMinutes("24:30-24:45")).toBeNull();
    });

    test("should return null if the interval doesn't end after it starts", () => {
      expect(getIntervalMinutes("17:00-16:00")).toBeNull();
      expect(getIntervalMinutes("17:00-17:00")).toBeNull();
    });
  });
});
