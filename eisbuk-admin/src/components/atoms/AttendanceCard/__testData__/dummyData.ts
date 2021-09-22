import firebase from "firebase";
import { DateTime } from "luxon";

import { Category, Customer, SlotType } from "eisbuk-shared";

import { CustomerWithAttendance } from "@/types/temp";

import { Props as AttendanceCardProps } from "../AttendanceCard";

import { timestampDate } from "@/__testData__/date";

import { luxon2ISODate } from "@/utils/date";

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
  category: Category.Competitive,
  secret_key: "123445",
};

export const walt: Customer = {
  id: "heisenberg",
  name: "Walter",
  surname: "White",
  certificateExpiration: "2001-01-01",
  category: Category.Competitive,
  email: "walt@im_the_one_who.knocks",
  phone: "123456777",
  birthday: "2001-01-01",
  covidCertificateReleaseDate: "2021-01-01",
  covidCertificateSuspended: false,
  secret_key: "000001",
};

export const gus: Customer = {
  id: "gus",
  name: "Gustavo",
  surname: "Fring",
  certificateExpiration: "2001-01-01",
  category: Category.Course,
  email: "gus@lospollos.me",
  phone: "123456777",
  birthday: "2001-01-01",
  covidCertificateReleaseDate: luxon2ISODate(DateTime.now().plus({ days: 1 })),
  covidCertificateSuspended: false,
  secret_key: "000002",
};

export const jian: Customer = {
  id: "jian",
  name: "Jian",
  surname: "Yang",
  certificateExpiration: "2022-01-01",
  category: Category.Competitive,
  email: "mike.hunt@isyourrefrigeratorrunning.me",
  phone: "123456777",
  birthday: "2001-01-01",
  covidCertificateReleaseDate: luxon2ISODate(DateTime.now().plus({ days: 1 })),
  covidCertificateSuspended: false,
  secret_key: "000002",
};

export const allCustomers = [gus, walt, saul, jian];

export const intervals = {
  "13:00-13:30": { startTime: "13:00", endTime: "13:30" },
  "13:00-14:00": { startTime: "13:00", endTime: "14:00" },
  "13:15-14:15": { startTime: "13:15", endTime: "14:15" },
};

export const intervalStrings = Object.keys(intervals);

export const baseProps: AttendanceCardProps = {
  id: "123",
  date: timestampDate as Timestamp,
  type: SlotType.Ice,
  intervals,
  categories: [Category.Competitive],
  notes: "",
  customers: [] as CustomerWithAttendance[],
  allCustomers,
};
