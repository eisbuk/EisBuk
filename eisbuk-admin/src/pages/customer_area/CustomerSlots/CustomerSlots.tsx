import React from "react";
import { DateTime } from "luxon";

import { Customer, SlotInterface } from "eisbuk-shared";

import { CustomerRoute } from "@/enums/routes";

import DateNavigation from "@/components/atoms/DateNavigation";
import SlotsDayContainer from "@/components/atoms/SlotsDayContainer";

import { orderByWeekDay } from "./utils";
import { LocalStore } from "@/types/store";
import BookingCardGroup from "@/components/atoms/BookingCardGroup";

interface SlotsByDay {
  [dayISO: string]: {
    [slotId: string]: SlotInterface;
  };
}

interface Props {
  /**
   * Customer id to pass down for interval booking operations.
   */
  customerId: Customer["id"];
  /**
   * Record of slots grouped by day's ISO date (day),
   * keyed by slotId within each day.
   */
  slots: SlotsByDay;
  /**
   * Record of subscribed slots with subscribed slotIds as keys and subscribed duration as value.
   * Doesn't need to be organized as we're checking for each value by key (no need for ordering and grouping).
   */
  bookedSlots?: LocalStore["firestore"]["data"]["bookedSlots"];
  /**
   * Controls view of slots with respect to view:
   * - if `book_ice` show month and group slots by day of the week
   * - if `book_off_ice` show a week of slots and show days in order
   */
  view?: CustomerRoute.BookIce | CustomerRoute.BookOffIce;
}

/**
 * A component used by `customers` page to render the slots available for booking.
 * - `book_ice` - would be passed slots of type `"ice"`, shows a month and orders days to show all Mondays first, then all Tuesdays, and so on
 * - `book_ice` - would be passed slots of type `"off_ice_dancing" | "off_ice_gym"`, shows a week and orders days in regular weekly order
 *
 * **note: slots passed are controlled outside the component, only the displaying/pagination is controlled within the component**
 */
const CustomerSlots: React.FC<Props> = ({
  customerId,
  slots,
  bookedSlots,
  view = CustomerRoute.BookIce,
}) => {
  const slotDates = Object.keys(slots);

  // if `view=book_ice` should order slot days mondays first and so on
  // if `view=book_off_ice` display week in standard order
  const orderedDates =
    view === CustomerRoute.BookIce ? orderByWeekDay(slotDates) : slotDates;

  const paginateBy = view === CustomerRoute.BookIce ? "month" : "week";

  return (
    <DateNavigation jump={paginateBy}>
      {() => (
        <>
          {orderedDates?.map((date) => {
            const luxonDay = DateTime.fromISO(date);
            const slostForDay = slots[date] || {};
            const slotsArray = Object.values(slostForDay);

            return (
              <SlotsDayContainer key={date} date={luxonDay}>
                {({ WrapElement }) => (
                  <>
                    {slotsArray.map((slot) => {
                      const bookedInterval = bookedSlots
                        ? bookedSlots[slot.id]?.interval
                        : undefined;

                      return (
                        <BookingCardGroup
                          key={slot.id}
                          {...{
                            ...slot,
                            bookedInterval,
                            WrapElement,
                            customerId,
                          }}
                        />
                      );
                    })}
                  </>
                )}
              </SlotsDayContainer>
            );
          })}
        </>
      )}
    </DateNavigation>
  );
};

export default CustomerSlots;
