import React from "react";
import { DateTime } from "luxon";

import i18n, { DateFormat } from "@eisbuk/translations";

interface SlotsDayContainerProps {
  date: DateTime;
  children?: React.ReactNode | React.ReactNode[];
}

const SlotsDayConatiner: React.FC<SlotsDayContainerProps> = ({
  children,
  date,
}) => {
  const dateString = i18n.t(DateFormat.Full, { date });

  return (
    <div className="pb-8 pt-[62px] border-b-2 border-gray-100">
      <h1 className="text-2xl font-normal leading-none text-gray-700 mb-8">
        {dateString}
      </h1>
      <div className="flex flex-wrap gap-6 items-end">{children}</div>
    </div>
  );
};

export default SlotsDayConatiner;
