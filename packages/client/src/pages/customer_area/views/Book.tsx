import React from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Button,
  EmptySpace,
  IntervalCardGroup,
  SlotsDayContainer,
} from "@eisbuk/ui";
import { SlotInterface } from "@eisbuk/shared";
import { Close } from "@eisbuk/svg";
import { Debug, Alerts, useTranslation } from "@eisbuk/translations";

import BookingsCountdownContainer from "@/controllers/BookingsCountdown";
import BookingDateDebugDialog from "@/controllers/BookingDateDebugController";

import {
  getBookingsCustomer,
  getSlotsForBooking,
} from "@/store/selectors/bookings";
import { getSecretKey } from "@/store/selectors/app";
import { getOrgEmail } from "@/store/selectors/orgInfo";

import { bookInterval } from "@/store/actions/bookingOperations";

import { createModal } from "@/features/modal/useModal";
import useBookingsDeadlines from "@/hooks/useBookingsDeadline";
import { getIsAdmin } from "@/store/selectors/auth";

const BookView: React.FC<{
  debugOn?: boolean;
  setDebugOn?: (x: boolean) => void;
}> = ({ debugOn = false, setDebugOn = () => {} }) => {
  const { t } = useTranslation();

  const isAdmin = useSelector(getIsAdmin);
  const secretKey = useSelector(getSecretKey) || "";
  const customer = useSelector(getBookingsCustomer(secretKey));
  const orgEmail = useSelector(getOrgEmail);
  const daysToRender = useSelector(getSlotsForBooking(secretKey));

  const { handleBooking, handleCancellation } = useBooking();

  const { isBookingAllowed } = useBookingsDeadlines();

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
      <div className="px-4 -mx-4 py-4 space-y-4 bg-ice-300 md:px-0 md:mx-0 md:bg-white">
        {debugOn && (
          <div className="mt-4">
            <BookingDateDebugDialog />
          </div>
        )}

        <BookingsCountdownContainer />
      </div>

      {daysToRender.map(({ date, slots }) => (
        <SlotsDayContainer key={date} date={date}>
          {slots.map(({ interval, ...slot }) => (
            <IntervalCardGroup
              key={slot.id}
              onBook={handleBooking(slot)}
              onCancel={handleCancellation(slot, interval)}
              bookedInterval={interval}
              disabled={!isBookingAllowed}
              {...slot}
            />
          ))}
        </SlotsDayContainer>
      ))}

      {isAdmin && (
        <div className="fixed bottom-0 w-full flex justify-end -mx-4 p-2 bg-ice-300 z-40 border-t border-gray-300 md:hidden">
          {debugOn ? (
            <Button
              onClick={() => setDebugOn(false)}
              className="w-12 h-12 text-gray-600"
            >
              <Close />
            </Button>
          ) : (
            <Button
              onClick={() => setDebugOn(true)}
              className="h-12 text-gray-600"
            >
              <span className="text-md">{t(Debug.DebugButtonLabel)}</span>
            </Button>
          )}
        </div>
      )}
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
