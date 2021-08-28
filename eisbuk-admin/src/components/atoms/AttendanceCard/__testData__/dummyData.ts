import { DateTime } from "luxon";

import { Category, Duration, SlotType } from "eisbuk-shared";

import { __storybookDate__ } from "@/lib/constants";

import { luxonToFB } from "@/utils/date";

export const users = [
  {
    name: "Saul",
    surname: "Goodman",
    certificateExpiration: "2001-01-01",
    customer_id: "saul",
    category: Category.PreCompetitive,
  },
  {
    name: "Walter",
    surname: "White",
    customer_id: "heisenberg",
    certificateExpiration: "2001-01-01",
    category: Category.PreCompetitive,
  },
];

// here we're using storybook date as default date and making sure that the slots starts at 13:00
const luxonDate = DateTime.fromISO(__storybookDate__).plus({ hours: 13 });

export const dummySlot = {
  date: luxonToFB(luxonDate),
  durations: [Duration["1.5h"], Duration["2h"]],
  type: SlotType.Ice,
  userBookings: users,
  categories: [Category.Competitive],
  absentees: ["heisenberg"],
  notes: "",
  id: "123",
};
