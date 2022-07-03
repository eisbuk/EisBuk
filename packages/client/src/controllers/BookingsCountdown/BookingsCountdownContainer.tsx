import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { BookingsCountdown, EmptySpace } from "@eisbuk/ui";

import {
  getBookingsCustomer,
  getCountdownProps,
  getMonthEmptyForBooking,
} from "@/store/selectors/bookings";
import { openModal } from "@/features/modal/actions";

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

  const countdownProps = useSelector(getCountdownProps);
  const isMonthEmpty = useSelector(getMonthEmptyForBooking);
  const { id: customerId } = useSelector(getBookingsCustomer) || {};

  if (!countdownProps || !customerId) return null;

  // No slots for booking message is shown using a bit different styles,
  // hence a different component
  if (isMonthEmpty) {
    return (
      <EmptySpace
        {...props}
      >{`No slots are currently available for the month of <strong>May</strong>`}</EmptySpace>
    );
  }

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
