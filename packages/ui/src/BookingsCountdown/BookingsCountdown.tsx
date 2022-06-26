import React from "react";
import { DateTime } from "luxon";

import { ExclamationCircle } from "@eisbuk/svg";

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
  as?: keyof JSX.IntrinsicElements;
}

/**
 * A presentational component showing a countdown for bookings with a provided message
 * and an option to "finalize" (lock) bookings in case of an extended time period.
 */
const BookingsCountdown: React.FC<BookingsCountdownProps> = ({
  variant,
  className,
  message,
  as = "div",
  ...props
}) => {
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
        dangerouslySetInnerHTML={{ __html: message }}
      />,
    ]
  );
};

const baseClasses = [
  "px-4",
  "py-3",
  "border-2",
  "rounded-lg",
  "text-gray-500",
  "text-base",
  "select-none",
  "flex",
  "items-center",
  "flex-row",
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

export default BookingsCountdown;
