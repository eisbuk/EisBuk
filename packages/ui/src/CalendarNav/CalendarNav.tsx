import React from "react";

import DateNavigation from "./DateNavigation";

interface CalendarNavProps extends React.HTMLAttributes<HTMLElement> {
  as?: keyof JSX.IntrinsicElements;
}

const CalendarNav: React.FC<CalendarNavProps> = ({ as = "div" }) =>
  React.createElement(
    as,
    { className: ["bg-ice-300 h-[52px] w-full p-[10px]"].join(" ") },
    <div className="container">
      <DateNavigation className="w-full md:w-[280px]" content="April 2022" />
    </div>
  );

export default CalendarNav;
