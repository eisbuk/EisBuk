import { DateTime } from "luxon";

import { Category, CustomerFull, luxon2ISODate } from "@eisbuk/shared";

export const saul: CustomerFull = {
  name: "Saul",
  surname: "Goodman",
  certificateExpiration: "2001-01-01",
  id: "saul",
  email: "saul@gmail.com",
  phone: "+123456777",
  birthday: "2001-01-01",
  covidCertificateReleaseDate: "2021-01-01",
  covidCertificateSuspended: true,
  categories: [Category.Competitive],
  secretKey: "123445",
  subscriptionNumber: "",
};

export const walt: CustomerFull = {
  id: "walt",
  name: "Walter",
  surname: "White",
  certificateExpiration: "2001-01-01",
  categories: [Category.Competitive],
  email: "walt@im_the_one_who.knocks",
  phone: "+123456777",
  birthday: "2002-01-01",
  covidCertificateReleaseDate: "2021-01-01",
  covidCertificateSuspended: false,
  secretKey: "000001",
  subscriptionNumber: "",
};

export const gus: CustomerFull = {
  id: "gus",
  name: "Gustavo",
  surname: "Fring",
  certificateExpiration: "2001-01-01",
  categories: [Category.CourseMinors],
  email: "gus@lospollos.me",
  phone: "+123456777",
  birthday: "2001-01-01",
  covidCertificateReleaseDate: luxon2ISODate(DateTime.now().plus({ days: 1 })),
  covidCertificateSuspended: false,
  secretKey: "000002",
  subscriptionNumber: "",
};

export const jian: CustomerFull = {
  id: "jian",
  name: "Jian",
  surname: "Yang",
  certificateExpiration: "2022-01-01",
  categories: [Category.CourseAdults],
  email: "mike.hunt@isyourrefrigeratorrunning.me",
  phone: "+123456777",
  birthday: "2001-01-01",
  covidCertificateReleaseDate: luxon2ISODate(DateTime.now().plus({ days: 1 })),
  covidCertificateSuspended: false,
  secretKey: "000002",
  subscriptionNumber: "",
};

export const mike: CustomerFull = {
  id: "mike",
  name: "Mike",
  surname: "Ehrmantraut",
  certificateExpiration: "2022-12-27",
  categories: [Category.PreCompetitiveMinors],
  email: "mike@ehrmantraut",
  phone: "+123456777",
  birthday: "2022-12-27",
  covidCertificateReleaseDate: luxon2ISODate(DateTime.now().plus({ days: 1 })),
  covidCertificateSuspended: false,
  secretKey: "000022",
  subscriptionNumber: "",
};

export const jane: CustomerFull = {
  id: "jane",
  name: "Jane",
  surname: "Margolis",
  certificateExpiration: "2023-03-27",
  categories: [Category.PreCompetitiveAdults],
  email: "jane@margolis",
  phone: "+123456777",
  birthday: "2009-12-23",
  covidCertificateReleaseDate: luxon2ISODate(DateTime.now().plus({ days: 1 })),
  covidCertificateSuspended: false,
  secretKey: "000222",
  subscriptionNumber: "",
};
