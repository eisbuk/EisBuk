import { DateTime } from "luxon";

import {
  CustomerBookings,
  CustomerFull,
  CustomersByBirthday,
  SlotType,
  wrapIter,
} from "@eisbuk/shared";

import { LocalStore } from "@/types/store";

import { compareCustomerNames } from "@/utils/sort";
import { calculateIntervalDuration, getMonthStr } from "@/utils/helpers";

/**
 * Get a record of all the customers for current organization from firebase store
 * (not an actual firestore query but rather synced local store entry)
 * @param state Local Redux Store
 * @returns record of customers
 */
export const getCustomersRecord = (
  state: LocalStore
): Record<string, CustomerFull> => state.firestore.data?.customers || {};

/**
 * Get a list of all the customers for current organization from firebase store
 * (not an actual firestore query but rather synced local store entry)
 * @param state Local Redux Store
 * @returns list of customers
 */
export const getCustomersList =
  (sort?: boolean) =>
  (state: LocalStore): CustomerFull[] => {
    const customerList = Object.values(getCustomersRecord(state) || {});
    return sort ? customerList.sort(compareCustomerNames) : customerList;
  };

/**
 * Gets a customer from a list of customers by 'secretKey'
 * @param secretKey a customers secret string
 * @returns a customer
 */
export const getCustomerBySecretKey =
  (secretKey: string) => (state: LocalStore) => {
    const customers = getCustomersList()(state);
    const customer = customers.find(
      (customer) => customer.secretKey === secretKey
    );
    return customer || {};
  };

/**
 * Gets a customer from a list of customers by 'id'
 * @param id a customers secret string
 * @returns a customer
 */
export const getCustomerById =
  (id: string) =>
  (state: LocalStore): CustomerFull | undefined => {
    const customers = getCustomersRecord(state);
    return customers[id];
  };

/**
 * Creates a selector that gets a list of all the customers whose birthdays are today
 * (not an actual firestore query but rather synced local store entry)
 * @param date DateTime to use as "today"
 * @returns selector to get a list of customers grouped by birthday
 */
export const getCustomersByBirthday =
  (date: DateTime) =>
  (state: LocalStore): CustomersByBirthday[] => {
    const customersInStore = getCustomersRecord(state);

    const customersByBirthday: CustomersByBirthday[] = [];
    Object.values(customersInStore).forEach((customer) => {
      // omit the customer if the birthday is not provided or customer is deleted
      if (!customer.birthday || customer.deleted) return;
      // we're using just the (mm/dd) date without the year
      const trimmedBirthday = customer.birthday.substring(5);
      const index = customersByBirthday.findIndex(
        (entry) => entry.date === trimmedBirthday
      );
      index !== -1
        ? customersByBirthday[index].customers.push(customer)
        : customersByBirthday.push({
            date: trimmedBirthday,
            customers: [customer],
          });
    });
    const sortedCustomersByBirthday = customersByBirthday.sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    const index = sortedCustomersByBirthday.findIndex(
      (entry) => date.toISODate().substring(5) <= entry.date
    );
    const rearrangedCustomers = sortedCustomersByBirthday
      .slice(index === -1 ? 0 : index)
      .concat(index === -1 ? [] : sortedCustomersByBirthday.slice(0, index));

    return rearrangedCustomers;
  };

/**
 * Gets customers that have empty categories array
 * @returns a customer array
 */
export const getCustomerByNoCategories = () => (state: LocalStore) => {
  const customersRecord = Object.values(getCustomersRecord(state) || {});
  const customers = customersRecord.filter(
    (customer) => !customer.categories.length && !customer.deleted
  );
  return customers || [];
};

export const getCustomersWithStats = (state: LocalStore) => {
  const { app, firestore } = state;
  const { calendarDay } = app;
  const {
    data: { bookings = {}, slotsByDay = {} },
  } = firestore;

  if (!slotsByDay) return bookings;
  const thisMonth = getMonthStr(calendarDay, 0);
  const nextMonth = getMonthStr(calendarDay, 1);

  const slotsThisMonth = slotsByDay[thisMonth] || [];
  const slotsNextMonth = slotsByDay[nextMonth] || [];

  return [
    ...wrapIter(
      Object.values(bookings as { [secretKey: string]: CustomerBookings })
    ).map((booking) => {
      const { bookedSlots, deleted } = booking;
      // return if user is deleted or no bookedSlots
      if (!bookedSlots || deleted) return booking;

      // check for each entry inside bookedSlots if it exists in slots this or next month
      const bookingStats = wrapIter(Object.entries(bookedSlots))._reduce(
        (bookedSlotAcc, [bookedSlotId, { interval, date }]) => {
          const slotsInDayThisMonth = slotsThisMonth[date] || [];
          const slotsInDayNextMonth = slotsNextMonth[date] || [];

          let thisBookingIceDuration = 0;
          let thisBookingOffIceDuration = 0;
          let nextBookingIceDuration = 0;
          let nextBookingOffIceDuration = 0;

          // if it doesn't exist it doesn't belong to this month
          if (slotsInDayThisMonth[bookedSlotId]) {
            const dur = calculateIntervalDuration(interval);
            // check its type and date/key and add it to respective counter/acc
            slotsInDayThisMonth[bookedSlotId].type === SlotType.Ice
              ? (thisBookingIceDuration = Number(dur))
              : (thisBookingOffIceDuration = Number(dur));
          } else if (slotsInDayNextMonth[bookedSlotId]) {
            const dur = calculateIntervalDuration(interval);
            slotsInDayNextMonth[bookedSlotId].type === SlotType.Ice
              ? (nextBookingIceDuration = Number(dur))
              : (nextBookingOffIceDuration = Number(dur));
          }

          return {
            ...bookedSlotAcc,
            thisMonthIce: bookedSlotAcc.thisMonthIce + thisBookingIceDuration,
            thisMonthOffIce:
              bookedSlotAcc.thisMonthOffIce + thisBookingOffIceDuration,
            nextMonthOffIce:
              bookedSlotAcc.nextMonthOffIce + nextBookingOffIceDuration,
            nextMonthIce: bookedSlotAcc.nextMonthIce + nextBookingIceDuration,
          };
        },
        {
          thisMonthIce: 0,
          thisMonthOffIce: 0,
          nextMonthIce: 0,
          nextMonthOffIce: 0,
        }
      );

      return { ...booking, bookingStats };
    }),
  ];
};
