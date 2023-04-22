import { test, expect, describe } from "vitest";
import { sortIntervals } from "../helpers";

interface TestParams {
  input: string[];
  want: string[];
}

const runSortIntervalsTableTests = (tests: TestParams[]) => {
  tests.forEach(({ input, want }) => {
    const [inputString, wantString] = [input, want].map(
      (arr) => '["' + arr.join('", "') + "]"
    );

    test(`Sort Intervals: Input: ${inputString}, want: ${wantString}`, () => {
      expect(input.sort(sortIntervals)).toEqual(want);
    });
  });
};

describe("Test helpers", () => {
  describe("sortIntervals", () => {
    runSortIntervalsTableTests([
      {
        input: ["09:00-10:00", "09:00-11:00", "09:00-10:30"],
        want: ["09:00-11:00", "09:00-10:30", "09:00-10:00"],
      },
      {
        input: ["10:00-12:00", "09:00-11:00", "08:00-09:30"],
        want: ["09:00-11:00", "10:00-12:00", "08:00-09:30"],
      },
      {
        input: ["09:00-10:00", "10:00-11:00", "08:00-09:00"],
        want: ["08:00-09:00", "09:00-10:00", "10:00-11:00"],
      },
    ]);
  });
});
