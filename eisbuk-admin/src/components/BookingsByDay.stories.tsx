import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";

import BookingsByDay from "@/components/BookingsByDay";

import { Duration, Category, SlotType } from "@/enums/firestore";

export default {
  title: "Bookings by day",
  component: BookingsByDay,
  argTypes: {
    markAbsentee: { action: "Absentee marked" },
  },
} as ComponentMeta<typeof BookingsByDay>;

// ***** Region Setup ***** //
const Template: ComponentStory<typeof BookingsByDay> = (args) => (
  <BookingsByDay {...args} />
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
// ***** End Region Setup ***** //

// ***** Region Empty ***** //
export const Empty = Template.bind({});
Empty.args = {
  bookingDayInfo: [],
};
Empty.argTypes = {};
// ***** End Region Empty ***** //

// ***** Region One Slot ***** //
export const OneSlot = Template.bind({});
OneSlot.args = {
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
// ***** End Region One Slot ***** //

// ***** Region Many Slots ***** //
export const ManySlots = Template.bind({});
ManySlots.args = {
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
// ***** End Region Many Slots ***** //
