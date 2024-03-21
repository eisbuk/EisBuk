import React from "react";

import { DateNavigation } from "../CalendarNav";

type DateFieldProps = {
  value: string;
  navigate: (days: -1 | 1) => () => void;
  onChange: (date: string) => void;
  onDestroy?: () => void;
};

type Props = {
  systemDate: DateFieldProps;
  extendedDate: DateFieldProps;
};

const DateDebug: React.FC<Props> = ({ systemDate, extendedDate }) => (
  <div className="flex items-center justify-between flex-wrap gap-4 rounded-lg p-4 border-2 border-gray-300">
    <div className="flex items-center gap-4">
      <span className="text-base font-semibold">System date:</span>
      <DateNavigation
        className="w-full md:w-[320px] border-gray-300 border-2 rounded"
        onPrev={systemDate.navigate(-1)}
        onNext={systemDate.navigate(1)}
      >
        <input
          className="h-full w-full border-none text-center"
          value={systemDate.value}
          onChange={(e) => systemDate.onChange(e.target.value)}
        />
      </DateNavigation>
    </div>

    <div className="flex items-center gap-4">
      <span className="text-base font-semibold">Extended booking date:</span>
      <DateNavigation
        className="w-full md:w-[320px] border-gray-300 border-2 rounded"
        onPrev={extendedDate.navigate(-1)}
        onNext={extendedDate.navigate(1)}
      >
        <input
          className="h-full w-full border-none text-center"
          value={extendedDate.value}
          onChange={(e) => extendedDate.onChange(e.target.value)}
        />
      </DateNavigation>
    </div>
  </div>
);
export default DateDebug;
