/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import _ from "lodash";
import { createSelector } from "reselect";

import { Slot, Customer, BookingInfo } from "eisbuk-shared";

import { LocalStore } from "@/types/store";

import { flatten, fs2luxon } from "@/utils/helpers";

import { getCustomersRecord } from "./firestore";
import { CustomerRoute } from "@/enums/routes";

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
): NonNullable<ReturnType<F>> | Record<string, any> => {
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
 * Get all slots in a single record, keyed by (day) date
 * @param state Local Redux Store
 * @returns record of all slots, keyed by day, grouped together (regardless of month)
 */
export const getAllSlotsByDay = (
  state: LocalStore
): Record<string, Slot<"id">> =>
  flatten(Object.values(getSafe(() => state.firestore.data.slotsByDay)));

/**
 * Get subscribed slots from state
 * @param state Local Redux Store
 * @returns record of subscribed slots
 */
export const getSubscribedSlots = (
  state: LocalStore
): Record<string, BookingInfo> =>
  getSafe(() => state.firestore.data.subscribedSlots);

/**
 * Selector creator higher order function
 * creates a selector for the day of slots (day provided as param)
 * @param dayStr date string for particular day ("yyyy-mm-dd")
 * @returns selector for record of slots (keyed by slot id), curried with the given day
 */
const getSlotsForADay = (dayStr: string) => (state: LocalStore) => {
  const monthStr = dayStr.substr(0, 7);
  return getSafe(() => state.firestore.data.slotsByDay![monthStr][dayStr]);
};

/**
 * HOF that creates a selector for view-specific slots by view in a single record, keyed by (day) date
 * @param view tab viewed by customer (ice, off-ice)
 * @returns record of view-specific ice slots, keyed by day, grouped together (regardless of month)
 */
export const getSlotsByView = (view: CustomerRoute) => (state: LocalStore) => {
  const allSlots = flatten(
    Object.values(getSafe(() => state.firestore.data.slotsByDay))
  );

  if (view === CustomerRoute.Calendar) return allSlots;
  return _.mapValues(allSlots, (daySlots) =>
    _.pickBy(daySlots, (slot) => {
      return view === CustomerRoute.BookIce
        ? slot.type === "ice"
        : slot.type !== "ice";
    })
  );
};

/**
 * Selector creator higher order function
 * creates a selector for the day of bookings (day provided as param)
 * @param dayStr date string for particular day ("yyyy-mm-dd")
 * @returns selector for record of bookings (keyed by slot id), curried with the given day
 */
const makeBookingsInfoSelector = (dayStr: string) => (state: LocalStore) =>
  getSafe(() => state.firestore.data.bookingsByDay![dayStr.substr(0, 7)]);

/**
 * Get slots for day, mapped with time info, and customers who booked that slot
 * @param dayStr date string for particular day ("yyyy-mm-dd")
 * @returns
 */
export const bookingDayInfoSelector = (dayStr: string) =>
  createSelector(
    getSlotsForADay(dayStr),
    makeBookingsInfoSelector(dayStr),
    getCustomersRecord,
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
