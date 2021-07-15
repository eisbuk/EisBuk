import firebase from "firebase/app";
import "firebase/firestore";
import { DateTime } from "luxon";

import { Slot } from "@/types/firestore";

import { shiftSlotsDay, shiftSlotsWeek } from "./slotutils";
import { FBToLuxon } from "./dtutils";

const Timestamp = firebase.firestore.Timestamp;

it("Shifts a list of slots to a new day, maintaining the time", () => {
  const newSlots = shiftSlotsDay([jan_10_slot], "2021-01-22");
  const res = FBToLuxon(newSlots[0].date);
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

it("Shifts a list of slots to a new week, maintaining the time and the day of week", () => {
  const weekFrom = DateTime.fromISO("2021-01-04");
  const weekTo = DateTime.fromISO("2021-01-11");
  const newSlots = shiftSlotsWeek([jan_10_slot], weekFrom, weekTo);
  const res = FBToLuxon(newSlots[0].date);
  expect(res.setZone("Europe/Berlin").toObject()).toEqual({
    day: 17,
    hour: 11,
    millisecond: 0,
    minute: 30,
    month: 1,
    second: 0,
    year: 2021,
  });
});

// Sunday 10th January. The beginning of the week is on Monday 4th
const day = new Date("10 Jan 2021 11:30:00 GMT+1");
const jan_10_slot = {
  date: Timestamp.fromDate(day),
} as Slot<"id">;
