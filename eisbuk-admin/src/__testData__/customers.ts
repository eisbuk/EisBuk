import { DateTime } from "luxon";

import { Category, Customer, luxon2ISODate } from "eisbuk-shared";

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
  secretKey: "123445",
};

export const walt: Customer = {
  id: "walt",
  name: "Walter",
  surname: "White",
  certificateExpiration: "2001-01-01",
  category: Category.Competitive,
  email: "walt@im_the_one_who.knocks",
  phone: "123456777",
  birthday: "2001-01-01",
  covidCertificateReleaseDate: "2021-01-01",
  covidCertificateSuspended: false,
  secretKey: "000001",
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
  secretKey: "000002",
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
  secretKey: "000002",
};
