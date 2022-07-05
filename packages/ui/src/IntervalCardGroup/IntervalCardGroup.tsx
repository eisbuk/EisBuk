import React from "react";

import { SlotInterface } from "@eisbuk/shared";

import IntervalCard, { IntervalCardState } from "../IntervalCard";

import { sortIntervals } from "../utils/helpers";

interface BookingCardGroupProps extends SlotInterface {
  /**
   * Booked interval for a slot, used to control the rendering
   */
  bookedInterval?: string | null;
  /**
   * Disable all `IntervalCard`s rendered by this instance
   */
  disabled?: boolean;
  /**
   * We're not dispatching directly to the store,
   * but rather calling an `onBook` function (for easier testing/storybook previews).
   * The parent component can then be in charge of providing the booking handler.
   */
  onBook?: (interval: string) => void;
  /**
   * We're not dispatching directly to the store,
   * but rather calling an `onCancel` function (for easier testing/storybook previews).
   * The parent component can then be in charge of providing the cancel handler.
   */
  onCancel?: () => void;
}

/**
 * A component used to render all of the intervals for a slot. It uses `IntervalCard` to render each interval
 * and controlls the variant/styles/disabling of the intervals with respect to `disabled` prop, and `bookedInterval`.
 *
 * The booking/canceling is controlled through `onBook` and `onCancel` handlers.
 */
const BookingCardGroup: React.FC<BookingCardGroupProps> = ({
  bookedInterval = null,
  intervals,
  onBook = () => {},
  onCancel = () => {},
  disabled: isDisabled,
  ...slot
}) => {
  const intervalsToRender = Object.keys(intervals || {}).sort(sortIntervals);

  return (
    <>
      {intervalsToRender.map((intervalKey) => {
        // Get `startTime` and `endTime`
        const interval = intervals[intervalKey];

        const isActive = intervalKey === bookedInterval;

        const state = isDisabled
          ? IntervalCardState.Disabled
          : isActive
          ? IntervalCardState.Active
          : IntervalCardState.Default;

        return (
          <IntervalCard
            key={intervalKey}
            {...{ ...slot, interval, onCancel, state }}
            onBook={() => onBook(intervalKey)}
          />
        );
      })}
    </>
  );
};

export default BookingCardGroup;
