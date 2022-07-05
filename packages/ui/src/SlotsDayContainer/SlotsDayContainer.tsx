import React from "react";
import { DateTime } from "luxon";

import i18n, { DateFormat } from "@eisbuk/translations";

interface SlotsDayContainerProps {
  date: string;
  className?: string;
  children?: React.ReactNode | React.ReactNode[];
}

const SlotsDayConatiner: React.FC<SlotsDayContainerProps> = ({
  date: dateISO,
  className,
  children,
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
      <h1 className="text-2xl font-normal leading-none text-gray-700 mb-8 cursor-normal select-none">
        {dateString}
      </h1>
      <div className="flex flex-wrap items-end gap-6 min-h-[146px]">
        {children}
      </div>
    </div>
  );
};

export default SlotsDayConatiner;
