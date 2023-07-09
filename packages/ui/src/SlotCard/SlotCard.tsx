import React from "react";

import { SlotInterface, SlotInterval, SlotType } from "@eisbuk/shared";
import i18n, { CategoryLabel } from "@eisbuk/translations";

import { testId } from "@eisbuk/testing/testIds";

import SlotTypeIcon from "../SlotTypeIcon";

import { comparePeriods } from "../utils/sort";

export interface SlotCardProps extends SlotInterface {
  className?: string;
  /**
   * Controls slot displaying different color when being selected
   */
  selected?: boolean;
  /**
   * Additional action buttons for slot operations. This isn't included in the component itself as it contains some complex functionality
   * that's best kept outside the component.
   */
  additionalActions?: JSX.Element;
  /**
   * Click handler for the entire card, will default to empty function if none is provided
   */
  onClick?: (e: React.SyntheticEvent) => void;
}

const SlotCard: React.FC<SlotCardProps> = ({
  className = "",
  selected,
  additionalActions = null,
  type,
  categories,
  intervals,
  notes,
  onClick,
}) => {
  const canClick = Boolean(onClick);

  const intervalStrings = Object.keys(intervals || {}).sort(comparePeriods);

  // calculate start time of first interval and end time of last interval
  // for title string rendering
  const intervalValues = Object.values(intervals || {});
  const { startTime, endTime }: SlotInterval = intervalStrings.reduce(
    (acc, intKey) => {
      const { startTime, endTime } = intervals[intKey];

      return {
        startTime: startTime < acc.startTime ? startTime : acc.startTime,
        endTime: endTime > acc.endTime ? endTime : acc.endTime,
      };
    },
    intervalValues[0] || { startTime: "00:00", endTime: "00:00" }
  );

  return (
    <div
      className={`relative max-w-[600px] px-4 py-2.5 outline outline-4 rounded-lg overflow-hidden select-none sm:min-w-sm ${
        selected ? "bg-yellow-200" : "bg-white"
      } ${type === SlotType.Ice ? "outline-cyan-500" : "outline-yellow-600"} ${
        canClick ? "cursor-pointer" : "cursor-normal"
      } ${className}`}
      data-testid={testId("slot-card")}
      onClick={onClick}
    >
      <div className="mb-4 pt-2 grid grid-cols-5 gap-x-6 gap-y-2">
        <h2 className="col-span-5 text-3xl font-bold whitespace-nowrap sm:col-span-2 sm:mb-0 sm:order-1">{`${startTime} - ${endTime}`}</h2>

        <div className="col-span-5 sm:col-span-3 sm:row-span-2 sm:order-2">
          <div className="flex flex-wrap items-start gap-x-1">
            {categories.map((category) => (
              <span
                className="mb-1 px-2 py-0.5 bg-teal-600 text-xs text-white font-semibold tracking-wide rounded uppercase whitespace-nowrap select-none"
                key={category}
              >
                {i18n.t(CategoryLabel[category])}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-start gap-1">
            {intervalStrings.map((interval) => (
              <span
                key={interval}
                className={`px-2 py-0.5 text-xs text-white font-semibold tracking-wide rounded whitespace-nowrap select-none ${
                  type === SlotType.Ice ? "bg-cyan-500" : "bg-yellow-600"
                }`}
              >
                {interval.replace("-", " - ")}
              </span>
            ))}
          </div>
        </div>

        <div className="col-span-5 text-base text-gray-500 font-medium sm:col-span-2 sm:order-3">
          {notes}
        </div>
      </div>

      <div className="flex items-center">
        <SlotTypeIcon
          key="slot-type-icon"
          className="h-full bg-inherit py-1"
          type={type}
        />

        {additionalActions}
      </div>
    </div>
  );
};

export default SlotCard;
