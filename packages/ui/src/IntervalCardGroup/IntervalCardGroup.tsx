import React from "react";

import { SlotInterface, comparePeriodsLongestFirst } from "@eisbuk/shared";
import { Alerts, useTranslation } from "@eisbuk/translations";

import IntervalCard, {
  IntervalCardState,
  IntervalCardVariant,
} from "../IntervalCard";

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
  const { t } = useTranslation();

  // The booked interval might no longer exist in the slot (removed by an admin after it was booked).
  // We still show it (as booked), so that the booking doesn't silently disappear and can be cancelled or replaced.
  const bookedIntervalRemoved = Boolean(
    bookedInterval && !intervals?.[bookedInterval],
  );
  const allIntervals = bookedIntervalRemoved
    ? { ...intervals, [bookedInterval!]: toSlotInterval(bookedInterval!) }
    : intervals || {};

  const intervalsToRender = Object.keys(allIntervals).sort(
    comparePeriodsLongestFirst,
  );

  return (
    <>
      {intervalsToRender.map((intervalKey) => {
        // Get `startTime` and `endTime`
        const interval = allIntervals[intervalKey];

        const isActive = intervalKey === bookedInterval;

        const state = isDisabled
          ? IntervalCardState.Disabled
          : isActive
            ? IntervalCardState.Active
            : IntervalCardState.Default;

        const notes =
          isActive && bookedIntervalRemoved
            ? t(Alerts.IntervalRemoved)
            : slot.notes;

        return (
          <IntervalCard
            key={intervalKey}
            variant={IntervalCardVariant.Booking}
            onBook={() => onBook(intervalKey)}
            {...{ ...slot, notes, interval, onCancel, state }}
          />
        );
      })}
    </>
  );
};

/**
 * Interval key ("16:00-17:00") to `{ startTime, endTime }`
 */
const toSlotInterval = (interval: string) => {
  const [startTime, endTime] = interval.split("-");
  return { startTime, endTime };
};

export default BookingCardGroup;
