import { LocalStore } from "@/types/store";

interface calendarSlot {
  [dayInISO: string]: string;
}

export const getCalendarData = (state: LocalStore): calendarSlot => {
  const {
    firestore: {
      data: { slotsByDay: allSlotsInStore, attendance = {} },
    },
  } = state;

  const slotsByDay = allSlotsInStore ?? {};

  const flattenedSlotsByDay = Object.values(slotsByDay).reduce(
    (acc, monthOfSlots) => {
      return { ...acc, ...monthOfSlots };
    },
    {}
  );
  const bookedDates = Object.values(attendance).reduce((acc, _) => {
    const bookedIntervals = Object.values(_.attendances).filter(
      (customerAttendance) => customerAttendance.bookedInterval
    );
    return bookedIntervals.length ? { ...acc, [_.date]: "booked" } : acc;
  }, {});

  const datesWithSlots: calendarSlot = Object.keys(flattenedSlotsByDay).reduce(
    (acc, _) => {
      return {
        ...acc,
        [_]: "slots",
      };
    },
    {}
  );
  return { ...datesWithSlots, ...bookedDates };
};
