import { Customer, CustomerWithAttendance } from "@eisbuk/shared";

import {
  compareCustomerBookings,
  compareCustomerNames,
  comparePeriods,
} from "../sort";

interface ComparePeriodsTest {
  name: string;
  input: string[];
  want: string[];
}

const comparePeriodsTableTests = (tests: ComparePeriodsTest[]) => {
  tests.forEach(({ name, input, want }) => {
    test(name, () => {
      expect(input.sort(comparePeriods)).toEqual(want);
    });
  });
};

interface CompareCustomerNamesTest {
  name: string;
  input: Pick<Customer, "name" | "surname">[];
  want: Pick<Customer, "name" | "surname">[];
}

const compareCustomerNamesTableTests = (tests: CompareCustomerNamesTest[]) => {
  tests.forEach(({ name, input, want }) => {
    test(name, () => {
      expect(input.sort(compareCustomerNames)).toEqual(want);
    });
  });
};

interface CompareCustomerBookingsTest {
  name: string;
  input: Pick<CustomerWithAttendance, "name" | "surname" | "bookedInterval">[];
  want: Pick<CustomerWithAttendance, "name" | "surname" | "bookedInterval">[];
}

const compareCustomerBookingsTableTests = (
  tests: CompareCustomerBookingsTest[]
) => {
  tests.forEach(({ name, input, want }) => {
    test(name, () => {
      expect(input.sort(compareCustomerBookings)).toEqual(want);
    });
  });
};

describe("Sort utils tests", () => {
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

  describe("Test 'compareCustomerNames' sorting", () => {
    compareCustomerNamesTableTests([
      {
        name: "should sort by surname in ascending order",
        input: [
          { name: "Afoo", surname: "Bbar" },
          { name: "Cfoo", surname: "Abar" },
          { name: "Bfoo", surname: "Cbar" },
        ],
        want: [
          { name: "Cfoo", surname: "Abar" },
          { name: "Afoo", surname: "Bbar" },
          { name: "Bfoo", surname: "Cbar" },
        ],
      },
      {
        name: "should sort by name if surname the same",
        input: [
          { name: "Bbar", surname: "foo" },
          { name: "Abar", surname: "foo" },
          { name: "Cbar", surname: "foo" },
        ],
        want: [
          { name: "Abar", surname: "foo" },
          { name: "Bbar", surname: "foo" },
          { name: "Cbar", surname: "foo" },
        ],
      },
      {
        name: "should be case insensitive",
        input: [
          { name: "abar", surname: "bfoo" },
          { name: "bar", surname: "Afoo" },
          { name: "Bbar", surname: "bfoo" },
        ],
        want: [
          { name: "bar", surname: "Afoo" },
          { name: "abar", surname: "bfoo" },
          { name: "Bbar", surname: "bfoo" },
        ],
      },
    ]);
  });

  describe("Test 'compareCustomerBookings' sorting", () => {
    compareCustomerBookingsTableTests([
      {
        name: "should sort by bookedInterval",
        input: [
          { name: "Foo", surname: "Abar", bookedInterval: "10:00-11:00" },
          { name: "Foo", surname: "Bbar", bookedInterval: "09:00-10:00" },
          { name: "Foo", surname: "Cbar", bookedInterval: "11:00-12:00" },
        ],
        want: [
          { name: "Foo", surname: "Bbar", bookedInterval: "09:00-10:00" },
          { name: "Foo", surname: "Abar", bookedInterval: "10:00-11:00" },
          { name: "Foo", surname: "Cbar", bookedInterval: "11:00-12:00" },
        ],
      },
      {
        name: "if bookedInterval the same, should sort aplhabetically",
        input: [
          { name: "Foo", surname: "Bbar", bookedInterval: "10:00-11:00" },
          { name: "Foo", surname: "Abar", bookedInterval: "10:00-11:00" },
          { name: "Foo", surname: "Cbar", bookedInterval: "10:00-11:00" },
        ],
        want: [
          { name: "Foo", surname: "Abar", bookedInterval: "10:00-11:00" },
          { name: "Foo", surname: "Bbar", bookedInterval: "10:00-11:00" },
          { name: "Foo", surname: "Cbar", bookedInterval: "10:00-11:00" },
        ],
      },
    ]);
  });
});
