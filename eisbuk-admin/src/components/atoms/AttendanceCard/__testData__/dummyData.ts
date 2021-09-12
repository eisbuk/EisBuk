import { DateTime } from "luxon";

import { Category, SlotType } from "eisbuk-shared";

import { __storybookDate__ } from "@/lib/constants";

import { luxonToFB } from "@/utils/date";

export const customers = [
  {
    name: "Saul",
    surname: "Goodman",
    certificateExpiration: "2001-01-01",
    id: "saul",
    email: "saul@better.call",
    phone: "123456777",
    birthday: "2001-01-01",
    covidCertificateReleaseDate: "2021-01-01",
    covidCertificateSuspended: true,
    category: Category.PreCompetitive,
    secret_key: "123445",
  },
  // {
  //   name: "Walter",
  //   surname: "White",
  //   customer_id: "heisenberg",
  //   certificateExpiration: "2001-01-01",
  //   category: Category.PreCompetitive,

  // },
];

// here we're using storybook date as default date and making sure that the slots starts at 13:00
const luxonDate = DateTime.fromISO(__storybookDate__).plus({ hours: 13 });

export const emptySlot = {
  date: luxonToFB(luxonDate),
  intervals: {
    "13:00-14:00": { startTime: "13:00", endTime: "14:00" },
    "13:15-14:15": { startTime: "13:15", endTime: "14:15" },
  },
  type: SlotType.Ice,
  customers: [],
  categories: [Category.Competitive],
  attendance: {},
  notes: "",
  id: "123",
};
export const customersSlot = {
  date: luxonToFB(luxonDate),
  intervals: {
    "13:00-14:00": { startTime: "13:00", endTime: "14:00" },
    "13:15-14:15": { startTime: "13:15", endTime: "14:15" },
  },
  type: SlotType.Ice,
  customers: customers,
  categories: [Category.Competitive],
  attendance: { saul: { booked: "13:00-14:00", attended: "13:00-14:00" } },
  notes: "",
  id: "123",
};
