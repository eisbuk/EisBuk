import firebase from "firebase";

import { Category, Customer, SlotType } from "eisbuk-shared";

import { Props as AttendanceCardProps } from "../AttendanceCard";

import { timestampDate } from "@/__testData__/date";
import { CustomerWithAttendance } from "@/types/temp";

type Timestamp = firebase.firestore.Timestamp;

export const saul: Customer = {
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
};

export const intervals = {
  "13:00-13:30": { startTime: "13:00", endTime: "13:30" },
  "13:00-14:00": { startTime: "13:00", endTime: "14:00" },
  "13:15-14:15": { startTime: "13:15", endTime: "14:15" },
};

export const customers = [
  saul,
  // {
  //   name: "Walter",
  //   surname: "White",
  //   customer_id: "heisenberg",
  //   certificateExpiration: "2001-01-01",
  //   category: Category.PreCompetitive,

  // },
];

export const baseProps: AttendanceCardProps = {
  id: "123",
  date: timestampDate as Timestamp,
  type: SlotType.Ice,
  intervals,
  categories: [Category.Competitive],
  notes: "",
  customers: [] as CustomerWithAttendance[],
};
