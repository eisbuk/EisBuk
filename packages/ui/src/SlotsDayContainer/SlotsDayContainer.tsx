import React from "react";
import { DateTime } from "luxon";

import { testId } from "@eisbuk/testing/testIds";

import i18n, { DateFormat } from "@eisbuk/translations";


interface SlotsDayContainerProps {
  date: string;
  className?: string;
  children?: React.ReactNode | React.ReactNode[];
  additionalContent?: JSX.Element | JSX.Element[];
  /** Tailwind class(es) for sticky top offset e.g. `top-20` or `top-12 sm:top-8 lg:top-40` */
  stickyOffset?: string
}

const SlotsDayConatiner: React.FC<SlotsDayContainerProps> = ({
  date: dateISO,
  className,
  children,
  additionalContent,
  stickyOffset = "top-0"
}) => {
  const date = DateTime.fromISO(dateISO);
  const dateString = i18n.t(DateFormat.Full, { date });

  const containerClasses = [
    "pb-8",
    "border-b-2",
    "border-gray-100",
    "md:pt-[62px]",
  ];

  return (
    <div
      data-testid={testId("slots-day-container")}
      data-date={dateISO}
      className={[...containerClasses, className].join(" ")}
    >
      <div
        className={`flex sticky ${stickyOffset} z-30 -wrap -mx-4 mb-8 px-4 py-4 bg-ice-300 md:flex-nowrap md:justify-between md:mx-0 md:gap-y-0 md:bg-white md:px-0 md:pt-6 md:pb-8`}
      >
        <h1 className="text-2xl font-normal leading-none text-gray-700 cursor-normal select-none whitespace-nowrap md:h-8">
          {dateString}
        </h1>
        <div className="w-full md:w-auto">
          {additionalContent}
        </div>
      </div>
      <div
        data-testid={testId("slots-day-content")}
        className="p-1 flex flex-wrap items-end gap-6 min-h-[146px]"
      >
        {children}
      </div>
    </div>
  );
};

export default SlotsDayConatiner;
