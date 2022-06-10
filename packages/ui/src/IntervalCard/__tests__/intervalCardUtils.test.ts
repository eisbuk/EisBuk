import { IntervalDuration } from "../types";

import { calculateDuration } from "../utils";

interface TestParams {
  startTime: string;
  endTime: string;
  want: IntervalDuration;
}

const runCalculateDurationTableTests = (tests: TestParams[]) => {
  tests.forEach(({ startTime, endTime, want }) =>
    test(`Start time: "${startTime}", End time: "${endTime}", want: ${want}`, () => {
      expect(calculateDuration(startTime, endTime)).toEqual(want);
    })
  );
};

describe("IntervalCard", () => {
  describe("calculateDuration util", () => {
    runCalculateDurationTableTests([
      { startTime: "09:00", endTime: "09:40", want: IntervalDuration["1h"] },
      { startTime: "09:00", endTime: "09:50", want: IntervalDuration["1h"] },
      { startTime: "09:00", endTime: "10:00", want: IntervalDuration["1h"] },

      { startTime: "09:00", endTime: "10:10", want: IntervalDuration["1.5h"] },
      { startTime: "09:00", endTime: "10:20", want: IntervalDuration["1.5h"] },
      { startTime: "09:00", endTime: "10:30", want: IntervalDuration["1.5h"] },

      { startTime: "09:00", endTime: "10:40", want: IntervalDuration["2h"] },
      { startTime: "09:00", endTime: "10:50", want: IntervalDuration["2h"] },
      { startTime: "09:00", endTime: "11:00", want: IntervalDuration["2h"] },
    ]);
  });
});
