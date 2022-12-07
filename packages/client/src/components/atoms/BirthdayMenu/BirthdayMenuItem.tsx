import React from "react";
import { DateTime } from "luxon";

import { Customer } from "@eisbuk/shared";
import { DateFormat, useTranslation } from "@eisbuk/translations";

import EisbukAvatar from "@/components/users/EisbukAvatar";

interface Props {
  customer: Customer;
  showAll?: boolean;
}

const BirthdayMenuItem: React.FC<Props> = ({ customer, showAll = false }) => {
  const { t } = useTranslation();

  const customerBirthday =
    customer.birthday?.substring(5) === DateTime.now().toISODate().substring(5)
      ? t(DateFormat.Today)
      : t(DateFormat.DayMonth, {
          date: DateTime.fromISO(customer.birthday || ""),
        });
  return (
    <li className="p-4 flex gap-8 items-center">
      <EisbukAvatar {...customer} wrap={false} />
      {customer.name} {customer.surname}
      {!showAll && <span className="block ml-auto">{customerBirthday}</span>}
    </li>
  );
};

export default BirthdayMenuItem;
