import React from "react";
import { DateTime, DateTimeUnit } from "luxon";

import { createDateTitle } from "@eisbuk/translations";

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
  onChange?: (date: DateTime) => void;
  /**
   * Time interval jump when incrementing/decrementing the date
   */
  jump: DateTimeUnit;
  /**
   * HTML tag of container element
   */
  as?: keyof JSX.IntrinsicElements;
  /**
   * Additional content to be rendered on the right side of the bar (on desktop)
   * or below the nav (on mobile)
   */
  additionalContent?: JSX.Element;
}

/**
 * A controlled component for date navigation: Receives current value for date
 * and calls function to update value with respect to provided `jump`
 */
const CalendarNav: React.FC<CalendarNavProps> = ({
  as = "div",
  date,
  onChange = () => {},
  jump,
  additionalContent,
  className: classes,
}) => {
  const updateDate = (delta: -1 | 1) => () =>
    onChange(date.plus({ [jump]: delta }));

  const className = ["bg-ice-300", "py-2.5", "w-full", "p-2.5", classes].join(
    " "
  );

  return React.createElement(
    as,
    { className },
    <div className="content-container gap-2.5 flex items-center flex-wrap md:justify-between">
      <DateNavigation
        className="w-full md:w-[280px]"
        content={createDateTitle(date, jump)}
        onPrev={updateDate(-1)}
        onNext={updateDate(1)}
      />
      {additionalContent && (
        <div className="w-full pl-auto md:w-auto">{additionalContent}</div>
      )}
    </div>
  );
};

export default CalendarNav;
