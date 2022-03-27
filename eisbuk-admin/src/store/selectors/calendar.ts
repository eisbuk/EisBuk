import { LocalStore } from "@/types/store";

interface calendarSlot {
  [dayInISO: string]: string;
}

export const getCalendarData = (state: LocalStore): calendarSlot => {
  const {
    firestore: {
      data: { slotsByDay: allSlotsInStore, attendance = {}, bookedSlots = {} },
    },
  } = state;

  const slotsByDay = allSlotsInStore ?? {};

  const flattenedSlotsByDay = Object.values(slotsByDay).reduce(
    (acc, monthOfSlots) => {
      return { ...acc, ...monthOfSlots };
    },
    {}
  );
  const getBookedSlots = () => {
    if (!Object.keys(attendance).length && !Object.keys(bookedSlots).length) {
return {};
}
    return Object.keys(attendance).length
      ? Object.values(attendance).reduce((acc, _) => {
          const bookedIntervals = Object.values(_.attendances).filter(
            (customerAttendance) => customerAttendance.bookedInterval
          );
          return bookedIntervals.length ? { ...acc, [_.date]: "booked" } : acc;
        }, {})
      : Object.values(bookedSlots).reduce(
          (acc, _) => ({ ...acc, [_.date]: "booked" }),
          {}
        );
  };

  const datesWithSlots: calendarSlot = Object.keys(flattenedSlotsByDay).reduce(
    (acc, _) => {
      return {
        ...acc,
        [_]: "slots",
      };
    },
    {}
  );
  return { ...datesWithSlots, ...getBookedSlots() };
};
