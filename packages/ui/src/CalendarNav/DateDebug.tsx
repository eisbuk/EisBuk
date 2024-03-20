import React from "react";
import { DateTime } from "luxon";

import { Close } from "@eisbuk/svg";

import DateNavigation from "./DateNavigation";

const DateDebug: React.FC<{
  value: DateTime;
  onChange: (date: DateTime) => void;
}> = ({ value, onChange }) => {
  const [editing, setEditing] = React.useState(false);

  const navigate = (days: -1 | 1) => () => onChange(value.plus({ days }));

  const [isoDate, setIsoDate] = React.useState(value.toISODate());
  React.useEffect(() => {
    setIsoDate(value.toISODate());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const _date = e.target.value;
    if (isIsoDate(_date)) {
      // If date is a valid ISO string, update the DateTime value
      // Local value is updated as side effect
      onChange(DateTime.fromISO(_date));
    }
    // Update the local value
    setIsoDate(_date);
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <span>System date:</span>
      {!editing ? (
        <>
          {value.toISODate()}
          <button
            className="bg-cyan-600 rounded px-2 py-1 text-white"
            onClick={() => setEditing(true)}
          >
            Debug
          </button>
        </>
      ) : (
        <>
          <DateNavigation
            className="w-full md:w-[320px]"
            onPrev={navigate(-1)}
            onNext={navigate(1)}
          >
            <input
              className="h-full w-full border-none text-center"
              value={isoDate}
              onChange={handleChange}
            />
          </DateNavigation>
          <button
            className="bg-red-600 rounded h-8 w-8 p-1 text-white"
            onClick={() => setEditing(false)}
          >
            <Close />
          </button>
        </>
      )}
    </div>
  );
};

export default DateDebug;

const isIsoDate = (date: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(date);
