import React from "react";

import i18n, {
  AttendanceAria,
  CategoryLabel,
  SlotTypeLabel,
  useTranslation,
} from "@eisbuk/translations";
import { SlotInterface, getSlotTimespan } from "@eisbuk/shared";
import { Plus } from "@eisbuk/svg";

import IconButton from "../IconButton";
import Divider from "./Divider";

export interface Props
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "slot"> {
  numAttended: number;
  slot: SlotInterface;
  onAddCustomers?: () => void;
  disableAddCustomers?: boolean;
}

/**
 * Attendance card for particular slot, used in order for admin
 * to be able to mark customer as being present and for which duration
 * for a particular slot. By default it shows all the customers who have
 * booked the slot and allows for manually adding customers who have not booked,
 * but have attended the slot for certain interval
 */
const AttendanceCardContainer: React.FC<Props> = ({
  className,
  numAttended,
  children,
  onAddCustomers,
  disableAddCustomers = false,
  slot,
  ...props
}) => {
  const { t } = useTranslation();

  const { intervals, categories, type } = slot;

  const timeString = getSlotTimespan(intervals);

  return (
    <div
      aria-label="attendance-card"
      className={`mb-8 border-px border border-gray-700 overflow-hidden rounded ${className}`}
      {...props}
    >
      <div className="w-full px-4 pt-4 pb-4 bg-gray-800">
        <h2 className="mb-2 font-mono text-xl text-white whitespace-nowrap">
          {timeString} ({numAttended})
        </h2>

        <div className="w-full flex justify-start items-center gap-1">
          {categories.map((category) => (
            <span
              key={category}
              className="px-2 !py-0 text-sm text-gray-800 rounded bg-teal-600"
            >
              {i18n.t(CategoryLabel[category])}
            </span>
          ))}
          <span className="px-2 !py-0 text-sm text-gray-800 rounded bg-teal-500">
            {i18n.t(SlotTypeLabel[type])}
          </span>
        </div>
      </div>

      <ul className="divide-y divide-gray-400">{children}</ul>

      <Divider />

      <IconButton
        aria-label={t(AttendanceAria.AddAttendedCustomers)}
        className={`!w-full h-12 py-1 text-center rounded-none ${
          disableAddCustomers
            ? "text-gray-300"
            : "active:bg-gray-200 active:text-gray-500"
        }`}
        onClick={onAddCustomers}
        disabled={disableAddCustomers}
      >
        <Plus />
      </IconButton>
    </div>
  );
};

export default AttendanceCardContainer;
