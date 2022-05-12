import { CustomerBookings } from "@eisbuk/shared";

import { saul, walt } from "./customers";

interface BookingsSubCollection {
  [k: string]: CustomerBookings;
}

export const bookings: BookingsSubCollection = {
  [saul.secretKey]: {
    deleted: false,
    surname: saul.surname,
    name: saul.name,
    id: saul.id,
    category: saul.category,
  },
  [walt.secretKey]: {
    deleted: false,
    surname: walt.surname,
    name: walt.name,
    id: walt.id,
    category: walt.category,
  },
};
