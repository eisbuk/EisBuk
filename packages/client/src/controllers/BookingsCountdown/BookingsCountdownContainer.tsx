import React from "react";
import { useSelector } from "react-redux";

import { BookingsCountdown, EmptySpace } from "@eisbuk/ui";
import i18n, { Alerts } from "@eisbuk/translations";

import { createModal } from "@/features/modal/useModal";

import {
  getBookingsCustomer,
  getMonthEmptyForBooking,
} from "@/store/selectors/bookings";

import useBookingsDeadlines from "@/hooks/useBookingsDeadline";

import {
  getCalendarDay,
  getSecretKey,
  getSystemDate,
} from "@/store/selectors/app";

interface Props extends React.HTMLAttributes<HTMLElement> {
  as?: keyof JSX.IntrinsicElements;
}

/**
 * A controller component for `BookingsCountdown` hooking to the store and
 * rendering the component with appropriate state whilst providing a way to update the
 * state to the store (for bookings finalisation).
 */
export const BookingsCountdownContainer: React.FC<Props> = (props) => {
  const secretKey = useSelector(getSecretKey)!;

  const currentDate = useSelector(getCalendarDay);
  const { value: systemDate } = useSelector(getSystemDate);

  const isMonthEmpty = useSelector(getMonthEmptyForBooking(secretKey));

  const { month, isBookingAllowed, deadline, countdownVariant } =
    useBookingsDeadlines();

  const countdownProps = {
    month,
    deadline: isBookingAllowed ? deadline : null,
    variant: countdownVariant,
  };

  const { id: customerId } = useSelector(getBookingsCustomer(secretKey)) || {};

  const { openWithProps: openFinalizeBookingsDialog } =
    useFinalizeBooksingsModal();

  // No slots for booking message is shown using a bit different styles,
  // hence a different component
  if (isMonthEmpty) {
    return (
      <EmptySpace {...props}>
        {i18n.t(Alerts.NoSlots, { currentDate })}
      </EmptySpace>
    );
  }

  if (!countdownProps || !customerId) return null;

  const handleFinalize = () => {
    const { month } = countdownProps;

    openFinalizeBookingsDialog({
      customerId,
      month,
      secretKey,
    });
  };

  return (
    <BookingsCountdown
      {...props}
      {...countdownProps}
      systemDate={systemDate}
      onFinalize={handleFinalize}
    />
  );
};

const useFinalizeBooksingsModal = createModal("FinalizeBookingsDialog");

export default BookingsCountdownContainer;
