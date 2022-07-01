import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { BookingsCountdown } from "@eisbuk/ui";

import {
  getBookingsCustomer,
  getCountdownProps,
} from "@/store/selectors/bookings";
import { openModal } from "@/features/modal/actions";

interface Props extends React.HTMLAttributes<HTMLElement> {
  as?: keyof JSX.IntrinsicAttributes;
}

/**
 * A controller component for `BookingsCountdown` hooking to the store and
 * rendering the component with appropriate state whilst providing a way to update the
 * state to the store (for bookings finalisation).
 */
const BookingsCountdownContainer: React.FC<Props> = (props) => {
  const dispatch = useDispatch();

  const countdownProps = useSelector(getCountdownProps);
  const { id: customerId } = useSelector(getBookingsCustomer) || {};

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
