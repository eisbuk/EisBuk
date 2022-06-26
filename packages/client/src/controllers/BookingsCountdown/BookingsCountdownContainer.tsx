import React from "react";
import { useSelector } from "react-redux";

import { BookingsCountdownVariant, BookingsCountdown } from "@eisbuk/ui";
import { BookingCountdownMessage } from "@eisbuk/translations";

import { getCalendarDay } from "@/store/selectors/app";
import { getCountdownProps } from "@/store/selectors/bookings";

interface Props extends React.HTMLAttributes<HTMLElement> {
  as?: keyof JSX.IntrinsicAttributes;
}

/**
 * A controller component for `BookingsCountdown` hooking to the store and
 * rendering the component with appropriate state whilst providing a way to update the
 * state to the store (for bookings finalisation).
 */
const BookingsCountdownContainer: React.FC<Props> = (props) => {
  const currentDate = useSelector(getCalendarDay);
  const countdownProps = useSelector(getCountdownProps(currentDate));

  if (!countdownProps) return null;

  const { deadline, message, month } = countdownProps;

  const handleFinalize = () => {
    /** There should be a confirmation dialog, so this is @TODO until the modal component is developed */
  };

  return (
    <BookingsCountdown
      {...props}
      {...{ deadline, month }}
      variant={messageVariantLookup[message]}
      onFinalize={handleFinalize}
    />
  );
};

/**
 * This is a dirty conversion back and forth (converter back into the message inside the component).
 * It is, however, @TEMP for compatibility with existing code and `getCountdownProps` should be rewritten a bit with the new component interface.
 */
const messageVariantLookup = {
  [BookingCountdownMessage.FirstDeadline]:
    BookingsCountdownVariant.FirstDeadline,
  [BookingCountdownMessage.SecondDeadline]:
    BookingsCountdownVariant.SecondDeadline,
  [BookingCountdownMessage.BookingsLocked]:
    BookingsCountdownVariant.BookingsLocked,
};

export default BookingsCountdownContainer;
