import { luxonToFB } from "@/utils/date";
import { Category, Duration, SlotType } from "eisbuk-shared";
import { DateTime } from "luxon";

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

export const dummySlot = {
  date: luxonToFB(DateTime.fromMillis(1629198000000)),
  durations: [Duration["1.5h"], Duration["2h"]],
  type: SlotType.Ice,
  userBookings: users,
  categories: [Category.Competitive],
  absentees: ["heisenberg"],
  notes: "",
  id: "123",
};
