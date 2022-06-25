import React from "react";

import { SlotInterface } from "@eisbuk/shared";

import IntervalCard, { IntervalCardState } from "../IntervalCard";

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
  ...slot
}) => {
  const intervalsToRender = Object.keys(intervals || {});

  return (
    <>
      {intervalsToRender.map((intervalKey) => {
        // Get `startTime` and `endTime`
        const interval = intervals[intervalKey];

        const isActive = intervalKey === bookedInterval;

        return (
          <IntervalCard
            key={intervalKey}
            state={
              isActive ? IntervalCardState.Active : IntervalCardState.Default
            }
            {...{ ...slot, interval, onCancel }}
            onBook={() => onBook(intervalKey)}
          />
        );
      })}
    </>
  );
};

export default BookingCardGroup;
