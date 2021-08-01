/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import _ from "lodash";
import { createSelector } from "reselect";

import { Slot, Customer } from "eisbuk-shared";

import { LocalStore } from "@/types/store";

import { fs2luxon } from "@/utils/helpers";

import { getCustomersFromFirebase } from "./firestore";

const extractSlotDate = (slot: Slot): number => slot.date.seconds;
const extractSlotId = (slot: Slot<"id">): Slot<"id">["id"] => slot.id;

/**
 * Try to execute the passed function.
 * If it fails or it returns default value or empty object,
 * @param fn function to execute
 * @param defaultVal default value (optional)
 * @returns first one sucessful out of: fn(), defaultVal, {}
 */
const getSafe = <F extends () => any>(
  fn: F,
  defaultVal?: ReturnType<F>
): ReturnType<F> | Record<string, any> => {
  // if no default val provided, fall back to empty object
  const def = defaultVal || {};

  // try and execute the function
  try {
    const result = fn();
    // if result undefined or null, return default value (or fallback)
    return [null, undefined].includes(result) ? def : result;
  } catch {
    // if error, return default value or fallback
    return def;
  }
};

/**
 * Selector creator higher order function
 * creates a selector for the day of slots (day provided as param)
 * @param dayStr date string for particular day ("yyyy-mm-dd")
 * @returns selector for record of slots (keyed by slot id), curried with the given day
 */
const getSlotsForADay = (dayStr: string) => (state: LocalStore) => {
  const monthStr = dayStr.substr(0, 7);
  return getSafe(() => state.firestore.data.slotsByDay[monthStr][dayStr]);
};

/**
 * Selector creator higher order function
 * creates a selector for the day of bookings (day provided as param)
 * @param dayStr date string for particular day ("yyyy-mm-dd")
 * @returns selector for record of bookings (keyed by slot id), curried with the given day
 */
const makeBookingsInfoSelector = (dayStr: string) => (state: LocalStore) =>
  getSafe(() => state.firestore.data.bookingsByDay[dayStr.substr(0, 7)]);

/**
 * Get slots for day, mapped with time info, and customers who booked that slot
 * @param dayStr date string for particular day ("yyyy-mm-dd")
 * @returns
 */
export const bookingDayInfoSelector = (dayStr: string) =>
  createSelector(
    getSlotsForADay(dayStr),
    makeBookingsInfoSelector(dayStr),
    getCustomersFromFirebase,
    (slotsInfo, bookingsInfo, allUsers) => {
      const slots = _.sortBy(Object.values(slotsInfo), [
        extractSlotDate,
        extractSlotId,
      ]);

      return slots.map((slot) => {
        const users = Object.keys(bookingsInfo[slot.id] ?? {}).map((key) => {
          const user =
            allUsers && allUsers[key]
              ? allUsers[key]
              : ({
                  name: "Cancellato",
                  surname: "Cancellato",
                  secret_key: "Cancellato",
                  id: key,
                } as Customer);
          return {
            name: user.name,
            surname: user.surname,
            certificateExpiration: user.certificateExpiration,
            secret_key: user.secret_key,
            id: user.id,
            duration: bookingsInfo[slot.id][key],
          };
        });

        // process slot data for return type
        // this seems a little weird and should be reviewed within code rewrite
        /** @TODO */
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { notes, date, ...slotBase } = slot;

        return {
          ...slotBase,
          time: fs2luxon(slot.date).toFormat(
            "HH:mm"
          ) /** @TODO check this out, might be better to do this kind of transformation at component level */,
          users: users,
        };
      });
    }
  );
