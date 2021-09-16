import { DateTime } from "luxon";

import { DeprecatedDuration } from "eisbuk-shared/dist/enums/deprecated/firestore";

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
      bookedDuration: DeprecatedDuration["1.5h"],
    };
  });
