import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { EmptySpace, IntervalCardGroup, SlotsDayContainer } from "@eisbuk/ui";
import { SlotInterface } from "@eisbuk/shared";
import { Alerts, useTranslation } from "@eisbuk/translations";

import BookingsCountdownContainer from "@/controllers/BookingsCountdown";

import {
  getBookingsCustomer,
  getIsBookingAllowed,
  getSlotsForBooking,
} from "@/store/selectors/bookings";
import { getCalendarDay, getSecretKey } from "@/store/selectors/app";
import { getOrgEmail } from "@/store/selectors/orgInfo";

import { bookInterval } from "@/store/actions/bookingOperations";

import { createModal } from "@/features/modal/useModal";

const BookView: React.FC = () => {
  const { t } = useTranslation();

  const customer = useSelector(getBookingsCustomer);
  const orgEmail = useSelector(getOrgEmail);
  const daysToRender = useSelector(getSlotsForBooking);
  const date = useSelector(getCalendarDay);
  const disabled = !useSelector(getIsBookingAllowed(date));

  const { handleBooking, handleCancellation } = useBooking();

  if (!customer?.categories?.length) {
    return (
      <EmptySpace className="!py-8 !px-10 !whitespace-normal">
        <p>
          <span className="leading-loose mx-8 w-full">
            {t(Alerts.NoCategories)}
          </span>
          <br />
          {orgEmail && (
            <span
              className="leading-loose mx-8"
              dangerouslySetInnerHTML={{
                __html: t(Alerts.ContactEmail, { email: orgEmail }),
              }}
            />
          )}
        </p>
      </EmptySpace>
    );
  }

  return (
    <>
      <BookingsCountdownContainer />
      {daysToRender.map(({ date, slots }) => (
        <SlotsDayContainer key={date} date={date}>
          {slots.map(({ interval, ...slot }) => (
            <IntervalCardGroup
              key={slot.id}
              onBook={handleBooking(slot)}
              onCancel={handleCancellation(slot, interval)}
              bookedInterval={interval}
              disabled={Boolean(disabled)}
              {...slot}
            />
          ))}
        </SlotsDayContainer>
      ))}
    </>
  );
};

/**
 * Slot booking and cancel logic, abstracted away in a hook for readability.
 */
const useBooking = () => {
  const dispatch = useDispatch();
  const secretKey = useSelector(getSecretKey)!;

  const { openWithProps: openCancelBookingDialog } = useCancelBookingModal();

  return {
    handleBooking:
      ({ date, id: slotId }: SlotInterface) =>
      (interval: string) => {
        dispatch(bookInterval({ slotId, interval, date, secretKey }));
      },

    handleCancellation: (slot: SlotInterface, interval?: string) => () => {
      if (!interval) return;

      const [startTime, endTime] = interval.split("-");

      openCancelBookingDialog({
        ...slot,
        secretKey,
        interval: { startTime, endTime },
      });
    },
  };
};

const useCancelBookingModal = createModal("CancelBookingDialog");

export default BookView;
