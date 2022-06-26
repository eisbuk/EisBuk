import React from "react";
import { DateTime } from "luxon";

import i18n, { BookingCountdownMessage } from "@eisbuk/translations";
import { ExclamationCircle } from "@eisbuk/svg";

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
      <span key="exclamation-circle" className="w-6 h-6 mb-2 md:mb-0 md:mr-2">
        <ExclamationCircle />
      </span>,
      <span
        className="max-w-[187px] text-center md:max-w-none md:whitespace-nowrap"
        dangerouslySetInnerHTML={{ __html: countdownMessage }}
      />,
    ]
  );
};

const baseClasses = [
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
  "md:justify-start",
];

const getColorClasses = (variant: BookingsCountdownVariant) =>
  [...baseClasses, ...variantColorLookup[variant]].join(" ");

const variantColorLookup = {
  [BookingsCountdownVariant.FirstDeadline]: ["text-red-600", "border-red-400"],
  [BookingsCountdownVariant.SecondDeadline]: [
    "text-yellow-600",
    "border-yellow-500",
  ],
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
