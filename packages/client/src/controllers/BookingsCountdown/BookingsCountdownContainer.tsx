import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { BookingsCountdown, EmptySpace } from "@eisbuk/ui";
import i18n, { Alerts } from "@eisbuk/translations";

import {
  getBookingsCustomer,
  getCountdownProps,
  getMonthEmptyForBooking,
} from "@/store/selectors/bookings";
import { openModal } from "@/features/modal/actions";
import { getCalendarDay } from "@/store/selectors/app";

interface Props extends React.HTMLAttributes<HTMLElement> {
  as?: keyof JSX.IntrinsicElements;
}

/**
 * A controller component for `BookingsCountdown` hooking to the store and
 * rendering the component with appropriate state whilst providing a way to update the
 * state to the store (for bookings finalisation).
 */
const BookingsCountdownContainer: React.FC<Props> = (props) => {
  const dispatch = useDispatch();

  const currentDate = useSelector(getCalendarDay);
  const countdownProps = useSelector(getCountdownProps);
  const isMonthEmpty = useSelector(getMonthEmptyForBooking);
  const { id: customerId } = useSelector(getBookingsCustomer) || {};

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

    dispatch(
      openModal({
        component: "FinalizeBookingsDialog",
        props: { customerId, month },
      })
    );
  };

  return (
    <BookingsCountdown
      {...props}
      {...countdownProps}
      onFinalize={handleFinalize}
    />
  );
};

export default BookingsCountdownContainer;
