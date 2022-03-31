import { CustomerBookingEntry, SlotsById, luxon2ISODate } from "eisbuk-shared";

import { baseSlot, intervals } from "@/__testData__/slots";
import { testDateLuxon } from "@/__testData__/date";

const intervalKeys = Object.keys(intervals);

type SlotsBookingsTuple = [SlotsById, Record<string, CustomerBookingEntry>];

export const [slots, bookedSlots]: SlotsBookingsTuple = Array(7)
  .fill(testDateLuxon)
  .reduce(
    (acc, dateLuxon, i) => {
      const luxonDay = dateLuxon.plus({ days: i });
      const date = luxon2ISODate(luxonDay);

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
