import React from "react";
import { DateTime } from "luxon";

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
    "pt-[44px]",
    "pb-8",
    "border-b-2",
    "border-gray-100",
    "md:pt-[62px]",
  ];

  return (
    <div className={[...containerClasses, className].join(" ")}>
      <div className="sticky top-0 z-40 bg-white pt-6 pb-8">
        <h1 className="text-2xl font-normal leading-none text-gray-700 cursor-normal select-none">
          {dateString}
        </h1>
        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          {additionalContent}
        </div>
      </div>
      <div className="p-1 flex flex-wrap items-end gap-6 min-h-[146px]">
        {children}
      </div>
    </div>
  );
};

export default SlotsDayConatiner;
