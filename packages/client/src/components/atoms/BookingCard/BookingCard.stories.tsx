import React, { useState } from "react";
import { ComponentMeta } from "@storybook/react";

import { SlotType } from "@eisbuk/shared";

import BookingCard from "./BookingCard";

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

const baseProps: Parameters<typeof BookingCard>[0] = {
  date: "2022-01-01",
  type: SlotType.Ice,
  interval: {
    startTime: "09:00",
    endTime: "10:00",
  },
  notes: "",
};

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

const halfHour = { startTime: "10:00", endTime: "10:30" };
const fullHour = { startTime: "10:00", endTime: "11:00" };
const hourAndAHalf = { startTime: "10:00", endTime: "11:30" };
const twoHours = { startTime: "10:00", endTime: "12:00" };
const tooLong = { startTime: "10:00", endTime: "12:30" };

export const DifferentDurations = (): JSX.Element => (
  <>
    Half hour:
    <BookingCard {...{ ...baseProps, interval: halfHour }} />
    Full hour:
    <BookingCard {...{ ...baseProps, interval: fullHour }} />
    Hour and a half:
    <BookingCard {...{ ...baseProps, interval: hourAndAHalf }} />
    Two hours:
    <BookingCard {...{ ...baseProps, interval: twoHours }} />
    Two plus:
    <BookingCard {...{ ...baseProps, interval: tooLong }} />
  </>
);
