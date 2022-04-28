import { Category, Customer } from "@eisbuk/shared";

export const saul: Customer = {
  name: "Saul",
  surname: "Goodman",
  certificateExpiration: "2001-01-01",
  id: "saul",
  email: "saul@better.call",
  phone: "+123456777",
  birthday: "2001-01-01",
  covidCertificateReleaseDate: "2021-01-01",
  covidCertificateSuspended: true,
  category: Category.Competitive,
  secretKey: "123445",
  subscriptionNumber: "",
};

export const walt: Customer = {
  id: "walt",
  name: "Walter",
  surname: "White",
  certificateExpiration: "2001-01-01",
  category: Category.Competitive,
  email: "walt@im_the_one_who.knocks",
  phone: "+123456777",
  birthday: "2002-01-01",
  covidCertificateReleaseDate: "2021-01-01",
  covidCertificateSuspended: false,
  secretKey: "000001",
  subscriptionNumber: "",
};

export const defaultUser = {
  email: "test@eisbuk.it",
  password: "test00",
  phone: "+3912345678",
};
