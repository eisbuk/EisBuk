import React from "react";
import { DateTime } from "luxon";

export enum BookingsCountdownVariant {
  FirstDeadline = "first-deadline",
  SecondDeadline = "second-deadline",
  BookingsLocked = "bookings-locked",
}

interface BookingsCountdownProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Date to countdown to (in luxon `DateTime` format)
   */
  countdownDate: DateTime;
  /**
   * first/second deadline, or bookings locked message
   */
  variant: BookingsCountdownVariant;
  /**
   * Text of the message to render on the countdown element.
   * I can feature html tags (such as `<strong>`).
   */
  message: string;
  /**
   * A handler fired when "finalize bookings" button is clicked
   */
  onFinalize?: () => void;
}

/**
 * A presentational component showing a countdown for bookings with a provided message
 * and an option to "finalize" (lock) bookings in case of an extended time period.
 */
const BookingsCountdown: React.FC<BookingsCountdownProps> = () => null;

export default BookingsCountdown;
