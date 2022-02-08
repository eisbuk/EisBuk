import React, { useMemo, useState } from "react";
import { DateTime } from "luxon";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Button } from "@material-ui/core";
import { httpsCallable, getFunctions } from "@firebase/functions";
import { getApp } from "@firebase/app";

import { SlotInterface } from "eisbuk-shared";

import { CustomerRoute } from "@/enums/routes";
import { ActionButton, Prompt } from "@/enums/translations";
import { CloudFunction } from "@/enums/functions";

import { LocalStore } from "@/types/store";

import ConfirmDialog from "@/components/global/ConfirmDialog";
import Countdown from "@/components/atoms/Countdown";
import DateNavigation from "@/components/atoms/DateNavigation";
import SlotsDayContainer from "@/components/atoms/SlotsDayContainer";
import BookingCardGroup from "@/components/atoms/BookingCardGroup";

import {
  getBookingsCustomer,
  getIsBookingAllowed,
  getShouldDisplayCountdown,
} from "@/store/selectors/bookings";

import { orderByWeekDay } from "./utils";
import { getOrganization } from "@/lib/getters";
import { getSecretKey } from "@/utils/localStorage";

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
  bookedSlots,
  view = CustomerRoute.BookIce,
}) => {
  const { t } = useTranslation();

  const slotDates = Object.keys(slots);

  // if `view=book_ice` should order slot days mondays first and so on
  // if `view=book_off_ice` display week in standard order
  const orderedDates =
    view === CustomerRoute.BookIce ? orderByWeekDay(slotDates) : slotDates;

  const paginateBy = view === CustomerRoute.BookIce ? "month" : "week";

  // should open bookings view with next month's slots
  const defaultDate = useMemo(() => DateTime.now().plus({ months: 1 }), []);

  const isBookingAllowed = useSelector(getIsBookingAllowed);

  // show countdown if booking deadline is close
  const { message, deadline, month } = useSelector(getShouldDisplayCountdown);
  const { id } = useSelector(getBookingsCustomer) || {};
  const secretKey = getSecretKey();

  const [finalizeBookings, setFinalizeBookings] = useState(false);
  const [isBookingFinalized, setIsBookingFinalized] = useState(false);
  const countdownMessage = message && t(message, { month });
  const countdownButton = (
    <>
      <Button
        disabled={isBookingFinalized}
        onClick={() => setFinalizeBookings(true)}
      >
        {t(ActionButton.FinalizeBookings)}
      </Button>
      <ConfirmDialog
        open={finalizeBookings}
        setOpen={setFinalizeBookings}
        onConfirm={async () => {
          await httpsCallable(
            getFunctions(getApp(), "europe-west6"),
            CloudFunction.FinalizeBookings
          )({ organization: getOrganization(), id, secretKey });
          setIsBookingFinalized(true);
        }}
        title={t(Prompt.FinalizeBookingsTitle)}
      >
        {t(Prompt.ConfirmFinalizeBookings)}
      </ConfirmDialog>
    </>
  );

  return (
    <DateNavigation jump={paginateBy} {...{ defaultDate }}>
      {() => (
        <>
          {countdownMessage && (
            <Countdown
              message={countdownMessage}
              countdownDate={deadline}
              actionButton={countdownButton}
            />
          )}
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
                          }}
                          disableAll={!isBookingAllowed}
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
