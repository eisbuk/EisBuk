import React from "react";
import { DateTime } from "luxon";

import { testId } from "@eisbuk/testing/testIds";

import i18n, { DateFormat } from "@eisbuk/translations";

interface SlotsDayContainerProps {
  date: string;
  className?: string;
  children?: React.ReactNode | React.ReactNode[];
  additionalContent?: JSX.Element | JSX.Element[];
}

const SlotsDayConatiner: React.FC<SlotsDayContainerProps> = ({
  date: dateISO,
  className,
  children,
  additionalContent,
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
        className="flex sticky top-0 z-30 flex-wrap -mx-4 mb-8 pl-4 pr-2 py-6 bg-ice-300 gap-y-6 md:flex-nowrap md:justify-between md:mx-0 md:gap-y-0 md:bg-white md:px-0 md:pt-6 md:pb-8"
      >
        <h1 className="text-3xl font-normal leading-none text-gray-700 cursor-normal select-none md:h-8 md:text-2x">
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
