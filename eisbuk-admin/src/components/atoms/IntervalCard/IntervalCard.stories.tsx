import React, { useState } from "react";
import { ComponentMeta } from "@storybook/react";

import IntervalCard from "./IntervalCard";

import { baseProps } from "./__testData__/dummyData";
import { BookingCardVariant } from "@/enums/components";

export default {
  title: "Interval Card",
  component: IntervalCard,
  decorators: [
    (Story) => (
      <div style={{ width: 400 }}>
        <Story />
      </div>
    ),
  ],
} as ComponentMeta<typeof IntervalCard>;

export const Default = (): JSX.Element => {
  /** We're using this in development to interactively test booked and non booked display */
  const [booked, setBooked] = useState<boolean>(false);

  return (
    <IntervalCard
      {...{ ...baseProps, booked }}
      bookInterval={() => setBooked(true)}
      cancelBooking={() => setBooked(false)}
    />
  );
};

export const WithNotes = (): JSX.Element => (
  <IntervalCard {...baseProps} notes="Pista 1" />
);

export const Booked = (): JSX.Element => <IntervalCard {...baseProps} booked />;

export const Faded = (): JSX.Element => <IntervalCard {...baseProps} fade />;

export const Disabled = (): JSX.Element => (
  <IntervalCard {...baseProps} disabled />
);

export const CalendarVariant = (): JSX.Element => (
  <IntervalCard {...baseProps} variant={BookingCardVariant.Calendar} />
);

export const CalendarVariantWithNotes = (): JSX.Element => (
  <IntervalCard
    {...baseProps}
    variant={BookingCardVariant.Calendar}
    notes="Pista 1"
  />
);
