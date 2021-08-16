import firebase from "firebase";
import { DateTime } from "luxon";

import { Slot } from "eisbuk-shared";

import { capitalizeFirst, mode } from "@/utils/helpers";
import { fb2Luxon } from "@/utils/date";
import { shiftSlotsDay, shiftSlotsWeek } from "@/utils/slots";

const Timestamp = firebase.firestore.Timestamp;

// ***** Region Helpers ***** //
describe("The 'capitalizeFirst' function", () => {
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

describe("Test 'mode' function", () => {
  test("should return member with highest occurrence", () => {
    const testArray = [1, 2, 2];
    expect(mode(testArray)).toEqual(2);
  });

  test("should return 'null' if two values have same number of occurrences", () => {
    const testArray = [1, 1, 2, 2];
    expect(mode(testArray)).toEqual(null);
  });
});
// ***** End Region Helpers ***** //

// ***** Region Slot Utils ***** //

// Sunday 10th January. The beginning of the week is on Monday 4th
const testDate = new Date("10 Jan 2021 11:30:00 GMT+1");
const testSlot = {
  date: Timestamp.fromDate(testDate),
} as Slot<"id">;

describe("Test 'shiftSlotsDay' util", () => {
  test("should shift a list of slots to a new day, maintaining the time", () => {
    const newSlots = shiftSlotsDay([testSlot], "2021-01-22");
    const res = fb2Luxon(newSlots[0].date);

    expect(res.setZone("Europe/Berlin").toObject()).toEqual({
      day: 22,
      hour: 11,
      millisecond: 0,
      minute: 30,
      month: 1,
      second: 0,
      year: 2021,
    });
  });
});

describe("Test 'shiftSlotsWeek' util ", () => {
  // we will be using the same new week for all the tests
  const newWeek = DateTime.fromISO("2021-01-11");

  // another test slot, belonging to the same week as initial test slot
  const testDateSameWeek = new Date("9 Jan 2021 11:30:00 GMT+1");
  const testSlotSameWeek = {
    date: Timestamp.fromDate(testDateSameWeek),
  } as Slot;

  // another test slot, belonging to a week different from other slots
  // used as an intruder for testing of error handling
  const testDateAnotherWeek = new Date("15 Jan 2021 11:30:00 GMT+1");
  const testSlotAnotherWeek = {
    date: Timestamp.fromDate(testDateAnotherWeek),
  } as Slot;

  test("should shift a list of slots to a new week, maintaining the time and the day of week", () => {
    const newSlots = shiftSlotsWeek([testSlot], newWeek);
    const res = fb2Luxon(newSlots[0].date);

    expect(res.setZone("Europe/Berlin").toObject()).toEqual({
      year: 2021,
      month: 1,
      day: 17,
      hour: 11,
      minute: 30,
      second: 0,
      millisecond: 0,
    });
  });

  test("error handling: should filter slots not belonging to given week", () => {
    const testSlots = [testSlot, testSlotSameWeek, testSlotAnotherWeek];
    const newSlots = shiftSlotsWeek(testSlots, newWeek);

    expect(newSlots.length).toEqual(2);
  });

  test("fault tolerence: should infer old week by majority of slots belonging to it", () => {
    const testSlots = [testSlotAnotherWeek, testSlotSameWeek, testSlot];
    const newSlots = shiftSlotsWeek(testSlots, newWeek);

    expect(newSlots.length).toEqual(2);
  });

  test("error handling: should throw an error if the slots are equally distributed across two different weeks", () => {
    const testSlots = [
      testSlotAnotherWeek,
      testSlotAnotherWeek,
      testSlotSameWeek,
      testSlot,
    ];

    expect(() => shiftSlotsWeek(testSlots, newWeek)).toThrow();
  });

  test("fault tolerence: should fall back to week start of passed 'newWeek' if 'newWeek' isn't week start", () => {
    const testSlots = [testSlot];
    const notWeekStart = newWeek.plus({ days: 1 });

    const newSlots = shiftSlotsWeek(testSlots, notWeekStart);
    const res = fb2Luxon(newSlots[0].date);

    expect(res.setZone("Europe/Berlin").toObject()).toEqual({
      year: 2021,
      month: 1,
      day: 17,
      hour: 11,
      minute: 30,
      second: 0,
      millisecond: 0,
    });
  });
});
// ***** Region Slot Utils ***** //
