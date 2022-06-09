import React from "react";
import { DateTime, DateTimeUnit } from "luxon";

import DateNavigation from "./DateNavigation";

interface CalendarNavProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  /**
   * Current value for date (kept outside the component)
   */
  date: DateTime;
  /**
   * Called on date update with appropriate value for date
   */
  onChange: (date: DateTime) => void;
  /**
   * Time interval jump when incrementing/decrementing the date
   */
  jump: DateTimeUnit;
  /**
   * HTML tag of container element
   */
  as?: keyof JSX.IntrinsicElements;
}

/**
 * A controlled component for date navigation: Receives current value for date
 * and calls function to update value with respect to provided `jump`
 */
const CalendarNav: React.FC<CalendarNavProps> = ({
  as = "div",
  date,
  onChange,
  jump,
}) => {
  const updateDate = (delta: -1 | 1) => () =>
    onChange(date.plus({ [jump]: delta }));

  return React.createElement(
    as,
    { className: ["bg-ice-300 h-[52px] w-full p-[10px]"].join(" ") },
    <div className="container">
      <DateNavigation
        className="w-full md:w-[280px]"
        content="April 2022"
        onPrev={updateDate(-1)}
        onNext={updateDate(1)}
      />
    </div>
  );
};

export default CalendarNav;
