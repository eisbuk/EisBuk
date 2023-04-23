import React from "react";

import { ChevronLeft, ChevronRight } from "@eisbuk/svg";
import { AttendanceAria, useTranslation } from "@eisbuk/translations";

import IconButton from "../IconButton";
import IntervalUI from "./IntervalUI";

interface Props
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "color"> {
  intervals: string[];
  onChange?: (attendedInterval: string) => void;
  attendedInterval: string;
  bookedInterval: string | null;
  disabled?: boolean;
}

const IntervalPicker: React.FC<Props> = ({
  intervals,
  bookedInterval,
  attendedInterval,
  onChange = () => {},
  className,
  disabled,
  ...props
}) => {
  const { t } = useTranslation();

  // get place of current interval in intervals array
  // used to disable prev/next buttons for first/last interval respectively
  const intervalIndex = intervals.findIndex(
    (interval) => interval === attendedInterval
  );
  const numIntervals = intervals.length;

  /**
   * Serves as `onChange` handler only without internal state.
   * Navigates left/right through interval selection
   * @param increment `-1` for previous, `1` for next
   */
  const handleClick = (increment: -1 | 1) => (e: React.SyntheticEvent) => {
    // As component is part of a larger, user attendance row component, which is itself clickable
    // we're preventing the bubbling of the click event.
    e.preventDefault();

    const newIndex = intervalIndex + increment;
    onChange(intervals[newIndex]);
  };

  const leftDisabled = disabled || intervalIndex === 0;
  const rightDisabled = disabled || intervalIndex === numIntervals - 1;

  return (
    <div
      className={`flex items-center w-64 h-10 font-mono ${className}`}
      {...props}
    >
      <IconButton
        onClick={handleClick(-1)}
        disabled={leftDisabled}
        aria-label={t(AttendanceAria.PreviousInterval)}
        className={`!w-16 !h-7 px-3 rounded text-inherit ${
          leftDisabled ? "bg-cyan-700/30" : "bg-cyan-700 active:bg-cyan-600"
        }`}
        disableHover
      >
        <ChevronLeft />
      </IconButton>

      <IntervalUI {...{ attendedInterval, bookedInterval }} />

      <IconButton
        onClick={handleClick(1)}
        disabled={rightDisabled}
        aria-label={t(AttendanceAria.NextInterval)}
        className={`!w-16 !h-7 px-3 rounded text-inherit ${
          rightDisabled ? "bg-cyan-700/30" : "bg-cyan-700 active:bg-cyan-600"
        }`}
        disableHover
      >
        <ChevronRight />
      </IconButton>
    </div>
  );
};

export default IntervalPicker;
