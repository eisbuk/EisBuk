import React from "react";
import { DateTime } from "luxon";

import { SlotInterface } from "eisbuk-shared";
import { DeprecatedDuration } from "eisbuk-shared/dist/enums/deprecated/firestore";

import { CustomerRoute } from "@/enums/routes";

import DateNavigation from "@/components/atoms/DateNavigation";
import SlotCard from "@/components/atoms/SlotCard";
import SlotsDayContainer from "@/components/atoms/SlotsDayContainer";

import { orderByWeekDay } from "./utils";

interface SlotsByDay {
  [dayISO: string]: {
    [slotId: string]: SlotInterface;
  };
}

interface SubscribedSlots {
  [slotId: string]: DeprecatedDuration;
}

interface Props {
  /**
   * Record of slots grouped by day's ISO date (day),
   * keyed by slotId within each day.
   *
   * Should be only slots with `SlotType.Ice`,
   * but we'll @TODO add fault tolerance here in case some
   * non ice slots slip in
   */
  slots: SlotsByDay;
  /**
   * Record of subscribed slots with subscribed slotIds as keys and subscribed duration as value.
   * Doesn't need to be organized as we're checking for each value by key (no need for ordering and grouping).
   */
  subscribedSlots?: SubscribedSlots;
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
  slots,
  subscribedSlots,
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
                      // check if slot is subscribed to
                      const subscribedDuration = subscribedSlots
                        ? subscribedSlots[slot.id]
                        : undefined;
                      return (
                        <WrapElement>
                          <SlotCard
                            key={slot.id}
                            {...(slot as any)}
                            {...{ subscribedDuration }}
                          />
                        </WrapElement>
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
