import React from "react";

import { Debug, useTranslation } from "@eisbuk/translations";

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

const DateDebug: React.FC<Props> = ({ systemDate, extendedDate }) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border-2 border-gray-300 px-4 py-2">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex flex-wrap w-full items-center gap-4 md:flex-nowrap">
          <span className="text-base font-semibold">
            {t(Debug.SystemDate)}:
          </span>

          <div className="flex w-full justify-center md:block md:w-auto">
            <DateNavigation
              className="w-full max-w-[480px] md:w-[320px] border-gray-300 border-2 rounded"
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
        </div>

        <div className="flex flex-wrap w-full items-center gap-4 md:flex-nowrap">
          <span className="text-base font-semibold">
            {t(Debug.ExtendedBookingDate)}:
          </span>

          <div className="flex w-full justify-center md:block md:w-auto">
            <DateNavigation
              className="w-full max-w-[480px] md:w-[320px] border-gray-300 border-2 rounded"
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
      </div>
      <p className="mt-4 w-full text-center font-bold italic">
        {t(Debug.DebugOnlyMessage)}
      </p>
    </div>
  );
};
export default DateDebug;
