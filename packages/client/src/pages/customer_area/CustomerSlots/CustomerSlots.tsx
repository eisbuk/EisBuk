import React, { useMemo, useState } from "react";
import { DateTime } from "luxon";
import { useSelector } from "react-redux";

import Alert from "@mui/material/Alert";

import { SlotInterface } from "@eisbuk/shared";
import { useTranslation, Alerts } from "@eisbuk/translations";

import { CustomerRoute } from "@/enums/routes";

import { LocalStore } from "@/types/store";

import BookingsCountdown from "@/components/atoms/BookingsCountdown";
import DateNavigation from "@/components/atoms/DateNavigation";
import SlotsDayContainer from "@/components/atoms/SlotsDayContainer";
import BookingCardGroup from "@/components/atoms/BookingCardGroup";
import AddToCalendar from "@/components/atoms/BookingsCountdown/AddToCalendar";

import {
  getBookedSlotsByMonth,
  getCountdownProps,
} from "@/store/selectors/bookings";
import { getCalendarDay } from "@/store/selectors/app";

import { orderByWeekDay, orderByDate } from "./utils";

import { __noSlotsDateId__ } from "@/__testData__/testIds";

interface SlotsByDay {
  [dayISO: string]: {
    [slotId: string]: SlotInterface;
  };
}

interface Props {
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
   * - if `book_off_ice` show month of slots and show days in order
   */
  view?: CustomerRoute.BookIce | CustomerRoute.BookOffIce;
}

/**
 * A component used by `customers` page to render the slots available for booking.
 * - `book_ice` - would be passed slots of type `"ice"`, shows a month and orders days to show all Mondays first, then all Tuesdays, and so on
 * - `book_ice` - would be passed slots of type `"off_ice_dancing" | "off_ice_gym"`, shows a month and orders days in regular weekly order
 *
 * **note: slots passed are controlled outside the component, only the displaying/pagination is controlled within the component**
 */
const CustomerSlots: React.FC<Props> = ({
  slots,
  bookedSlots,
  view = CustomerRoute.BookIce,
}) => {
  const slotDates = Object.keys(slots);

  const { t } = useTranslation();

  // if `view=book_ice` should order slot days mondays first and so on
  // if `view=book_off_ice` display in standard order
  const orderedDates =
    view === CustomerRoute.BookIce
      ? orderByWeekDay(slotDates)
      : orderByDate(slotDates);

  const paginateBy = "month";

  // should open bookings view with next month's slots
  const defaultDate = useMemo(() => DateTime.now().plus({ months: 1 }), []);

  // show countdown if booking deadline is close
  const currentDate = useSelector(getCalendarDay);
  const selectorCountdownProps = useSelector(getCountdownProps(currentDate));

  // show add to calendar if there are booked slots in the current month and if bookings are finalized
  const bookedSlotsByMonth = useSelector(
    getBookedSlotsByMonth(currentDate.month)
  );

  // control local booking finalized to disable 'finalize' buttons on all instances of second countdown
  const [isBookingFinalized, setIsBookingFinalized] = useState(false);

  // all props passed down to BookingsCountdown:
  // including countdown props from selector and 'finalize' button local state
  const countdownProps = selectorCountdownProps
    ? {
        ...selectorCountdownProps,
        isBookingFinalized,
        setIsBookingFinalized,
      }
    : // fall back to `null` if `selectorFromCountdownProps` not defined
      // and prevent showing of countdown messages
      null;

  // if no slots in a day, return just the no-slots message
  const noSlots = (
    <Alert data-testid={__noSlotsDateId__} severity="info">
      {t(Alerts.NoSlots, { currentDate })}
    </Alert>
  );

  // actual slots display content
  const content = (
    <>
      {countdownProps && <BookingsCountdown {...countdownProps} />}
      {Object.keys(bookedSlotsByMonth).length && (
        <AddToCalendar bookedSlots={bookedSlotsByMonth} />
      )}
      {orderedDates?.map((date) => {
        const luxonDay = DateTime.fromISO(date);
        const slostForDay = slots[date] || {};
        const slotsArray = Object.values(slostForDay);

        return (
          <SlotsDayContainer key={date} date={luxonDay}>
            {({ WrapElement, lockBookings }) => (
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
                      }}
                      disableAll={lockBookings}
                    />
                  );
                })}
              </>
            )}
          </SlotsDayContainer>
        );
      })}
    </>
  );

  return (
    <DateNavigation jump={paginateBy} {...{ defaultDate }}>
      {() => (!Object.keys(slots).length ? noSlots : content)}
    </DateNavigation>
  );
};

export default CustomerSlots;
