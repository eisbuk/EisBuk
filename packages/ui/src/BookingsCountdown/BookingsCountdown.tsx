import React from "react";
import { DateTime } from "luxon";

import i18n, {
  BookingCountdownMessage,
  ActionButton,
} from "@eisbuk/translations";
import { ExclamationCircle } from "@eisbuk/svg";

import Button from "../Button";

import useCountdown from "./useCountdown";

export enum BookingsCountdownVariant {
  FirstDeadline = "first-deadline",
  SecondDeadline = "second-deadline",
  BookingsLocked = "bookings-locked",
}

interface BookingsCountdownProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Date to countdown to (in luxon `DateTime` format)
   */
  deadline: DateTime | null;
  /**
   * The date the countdown/locked bookings message is for
   */
  month: DateTime;
  /**
   * first/second deadline, or bookings locked message
   */
  variant: BookingsCountdownVariant;
  /**
   * A handler fired when "finalize bookings" button is clicked
   */
  onFinalize?: () => void;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * A presentational component showing a countdown for bookings with a provided message
 * and an option to "finalize" (lock) bookings in case of an extended time period.
 */
const BookingsCountdown: React.FC<BookingsCountdownProps> = ({
  variant,
  className,
  deadline,
  month,
  onFinalize,
  as = "div",
  ...props
}) => {
  const countdown = useCountdown(deadline, "hour");
  const message = variantMessageLookup[variant];

  const countdownMessage = i18n.t(message, {
    ...(countdown
      ? // bookings locked message (no deadline, no countdown) doesn't accept any props
        {
          days: countdown.days,
          hours: countdown.hours,
          date: deadline,
          month: month,
        }
      : { month }),
  });

  return React.createElement(
    as,
    {
      ...props,
      className: [getColorClasses(variant), className].join(" "),
    },
    [
      <span
        key="exclamation-circle"
        className="hidden w-6 h-6 mb-2 md:block md:mb-0 md:mr-2"
      >
        <ExclamationCircle />
      </span>,
      <span
        key="countdown-message"
        className="max-w-[200px] text-center md:max-w-none md:whitespace-nowrap"
        dangerouslySetInnerHTML={{ __html: countdownMessage }}
      />,
      variant === BookingsCountdownVariant.SecondDeadline && (
        <Button
          key="finalize-button"
          className="w-3/4 text-white bg-gray-500 tracking-wider active:bg-gray-600 md:w-auto md:absolute md:right-2"
          onClick={onFinalize}
        >
          {i18n.t(ActionButton.FinalizeBookings)}
        </Button>
      ),
    ]
  );
};

const baseClasses = [
  "relative",
  "px-4",
  "py-3",
  "flex",
  "flex-row",
  "items-center",
  "justify-evenly",
  "border-2",
  "rounded-lg",
  "text-base",
  "select-none",
  "flex-wrap",
  "gap-3",
  "md:justify-start",
];

const getColorClasses = (variant: BookingsCountdownVariant) =>
  [...baseClasses, ...variantColorLookup[variant]].join(" ");

const variantColorLookup = {
  [BookingsCountdownVariant.FirstDeadline]: [
    "text-yellow-600",
    "border-yellow-500",
  ],
  [BookingsCountdownVariant.SecondDeadline]: ["text-red-600", "border-red-400"],
  [BookingsCountdownVariant.BookingsLocked]: [
    "text-gray-500",
    "border-gray-300",
  ],
};

const variantMessageLookup = {
  [BookingsCountdownVariant.FirstDeadline]:
    BookingCountdownMessage.FirstDeadline,
  [BookingsCountdownVariant.SecondDeadline]:
    BookingCountdownMessage.FirstDeadline,
  [BookingsCountdownVariant.BookingsLocked]:
    BookingCountdownMessage.BookingsLocked,
};

export default BookingsCountdown;
