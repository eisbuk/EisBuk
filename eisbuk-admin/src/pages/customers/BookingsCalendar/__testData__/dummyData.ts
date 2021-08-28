import { DateTime } from "luxon";

import { Duration } from "eisbuk-shared";

import { luxonToFB } from "@/utils/date";

import { dummySlot } from "@/__testData__/dummyData";

export const bookedSlots = Array(7)
  .fill("2021-03-01")
  .map((dateISO, i) => {
    const luxonDay = DateTime.fromISO(dateISO).plus({ days: i, hours: 9 });
    const date = luxonToFB(luxonDay);
    return {
      ...dummySlot,
      id: `slot-${i}`,
      date,
      bookedDuration: Duration["1.5h"],
    };
  });
