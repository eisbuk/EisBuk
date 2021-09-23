import { CustomerBookingEntry, SlotsById } from "eisbuk-shared";

import { luxonToFB } from "@/utils/date";

import { baseSlot, intervals } from "@/__testData__/dummyData";
import { testDateLuxon } from "@/__testData__/date";

const intervalKeys = Object.keys(intervals);

type SlotsBookingsTuple = [SlotsById, Record<string, CustomerBookingEntry>];

export const [slots, bookedSlots]: SlotsBookingsTuple = Array(7)
  .fill(testDateLuxon)
  .reduce(
    (acc, dateLuxon, i) => {
      const luxonDay = dateLuxon.plus({ days: i });
      const date = luxonToFB(luxonDay);

      const slotId = `slot-${i}`;

      return [
        // create a slot entry for this slot
        { ...acc[0], [slotId]: { ...baseSlot, id: slotId, date } },
        // create a booking entry for this slot
        {
          ...acc[1],
          [slotId]: { date, interval: intervalKeys[0] },
        },
      ];
    },
    [{}, {}] as SlotsBookingsTuple
  );
