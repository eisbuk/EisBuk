import React, { useState } from "react";
import { ComponentMeta } from "@storybook/react";

import BookingCard from "./BookingCard";

import { baseProps } from "./__testData__/dummyData";
import { BookingCardVariant } from "@/enums/components";

export default {
  title: "Booking Card",
  component: BookingCard,
  decorators: [
    (Story) => (
      <div style={{ width: 400 }}>
        <Story />
      </div>
    ),
  ],
} as ComponentMeta<typeof BookingCard>;

export const Default = (): JSX.Element => {
  /** We're using this in development to interactively test booked and non booked display */
  const [booked, setBooked] = useState<boolean>(false);

  return (
    <BookingCard
      {...{ ...baseProps, booked }}
      bookInterval={() => setBooked(true)}
      cancelBooking={() => setBooked(false)}
    />
  );
};

export const WithNotes = (): JSX.Element => (
  <BookingCard {...baseProps} notes="Pista 1" />
);

export const Booked = (): JSX.Element => <BookingCard {...baseProps} booked />;

export const Faded = (): JSX.Element => <BookingCard {...baseProps} fade />;

export const Disabled = (): JSX.Element => (
  <BookingCard {...baseProps} disabled />
);

export const CalendarVariant = (): JSX.Element => (
  <BookingCard {...baseProps} variant={BookingCardVariant.Calendar} />
);

export const CalendarVariantWithNotes = (): JSX.Element => (
  <BookingCard
    {...baseProps}
    variant={BookingCardVariant.Calendar}
    notes="Pista 1"
  />
);
