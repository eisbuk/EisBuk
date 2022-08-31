import { comparePeriods } from "../sort";

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

describe("Test 'comparePeriods' sorting", () => {
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
  ]);

  test("Edge case: should return 0 if periods are the same (this will be used for composition of compare functions)", () => {
    expect(comparePeriods("12:00", "12:00")).toEqual(0);
  });
});
