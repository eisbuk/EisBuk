import React from "react";
import BookingsByDay from "./BookingsByDay";

import { Duration, Category, SlotType } from "@/enums/firestore";

export default {
  title: "Bookings by day",
  component: BookingsByDay,
};

export const Empty = (): JSX.Element => (
  <BookingsByDay bookingDayInfo={[]} markAbsentee={() => {}} />
);

const oneSlotProps = {
  bookingDayInfo: [
    {
      time: "11:00",
      categories: [Category.Agonismo],
      type: SlotType.Ice,
      id: "foo",
      durations: [Duration["1.5h"], Duration["2h"]],
      users: [],
    },
  ],
};

export const OneSlot = (): JSX.Element => (
  <BookingsByDay {...oneSlotProps} markAbsentee={() => {}} />
);

export const ManySlots = (): JSX.Element => (
  <BookingsByDay {...manySlotsProps} markAbsentee={() => {}} />
);

const gus = {
  name: "Gus",
  surname: "Fring",
  id: "gus",
  category: Category.Corso,
};

const saul = {
  name: "Saul",
  surname: "Goodman",
  id: "saul",
  category: Category.Agonismo,
  certificateExpiration: "2001-01-01",
};

const heisenberg = {
  name: "Walter",
  surname: "White",
  id: "heisenberg",
  category: Category.Preagonismo,
};

const jesse = {
  name: "Jesse",
  surname: "Pinkman",
  id: "jesse",
  category: Category.Preagonismo,
};

const manySlotsProps = {
  bookingDayInfo: [
    {
      time: "11:00",
      categories: [Category.Agonismo],
      type: SlotType.Ice,
      id: "foo",
      durations: [Duration["1.5h"], Duration["2h"]],
      users: [
        {
          ...saul,
          duration: Duration["1.5h"],
        },
      ],
    },
    {
      time: "12:00",
      categories: [Category.Agonismo],
      type: SlotType.Ice,
      durations: [Duration["1h"], Duration["2h"]],
      id: "bar",
      users: [
        {
          ...heisenberg,
          duration: Duration["1h"],
        },
        { ...gus, duration: Duration["1h"] },
        {
          ...saul,
          duration: Duration["2h"],
        },
      ],
      absentees: {
        gus: true,
      },
    },
    {
      time: "15:00",
      categories: [Category.Agonismo, Category.Preagonismo, Category.Corso],
      type: SlotType.Ice,
      id: "baz",
      durations: [Duration["1h"]],
      users: [],
    },
    {
      time: "16:30",
      categories: [Category.Agonismo, Category.Preagonismo],
      type: SlotType.OffIceDanza,
      id: "bat",
      durations: [Duration["1h"], Duration["2h"]],
      users: [
        {
          ...heisenberg,
          duration: Duration["1h"],
        },
        {
          ...jesse,
          duration: Duration["1.5h"],
        },
      ],
    },
  ],
};

const markAbsentee = () => {
  alert("Absentee marked");
};

export const ManySlotsWithAbsentee = (): JSX.Element => (
  <BookingsByDay {...manySlotsProps} markAbsentee={markAbsentee} />
);
