import { LocalStore } from "@/types/store";

interface calendarSlot {
  [dayInISO: string]: string;
}

export const getCalendarData = (state: LocalStore): calendarSlot => {
  const {
    firestore: {
      data: { slotsByDay: allSlotsInStore },
    },
  } = state;

  const slotsByDay = allSlotsInStore ?? {};

  const flattenedSlotsByDay = Object.values(slotsByDay).reduce(
    (acc, monthOfSlots) => {
      return { ...acc, ...monthOfSlots };
    },
    {}
  );

  console.log(Object.keys(flattenedSlotsByDay));
  return Object.keys(flattenedSlotsByDay).reduce((acc, _) => {
    /**
     * @TODO get booked slots from attendance.bookedinterval
     */

    return {
      ...acc,
      [_]: "slots",
    };
  }, {} as calendarSlot);
};
