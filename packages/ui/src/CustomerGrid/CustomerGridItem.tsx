import React from "react";
import { DateTime } from "luxon";

import { Customer, CustomerFull } from "@eisbuk/shared";
import { useTranslation, DateFormat } from "@eisbuk/translations";

import { CustomerAvatar, BadgeSize } from "../UserAvatar";

import { shortName, capitalizeFirst } from "../utils/helpers";

export interface GridItemProps extends CustomerFull {
  onClick?: (customer: Customer) => void;
}

const CustomerGridItem: React.FC<GridItemProps> = ({
  onClick = () => {},
  ...customer
}) => {
  const customerValidated = customer.categories.length > 0;

  const [sName, sSurname] = shortName(customer.name, customer.surname);

  const thisMonth = DateTime.now();
  const nextMonth = DateTime.now().plus({ month: 1 });

  const { t } = useTranslation();

  return (
    <div
      style={
        customerValidated ? {} : { opacity: 0.5, filter: "grayscale(90%)" }
      }
      onClick={() => onClick(customer)}
      className="border-box border-2 rounded-lg border-gray-100 w-[16rem] h-[17rem] p-2 flex items-center flex-col cursor-pointer"
    >
      <CustomerAvatar
        badgeSize={BadgeSize.LG}
        className="w-20 h-20 mb-2"
        {...{ customer }}
      />
      <p className="w-full text-center truncate p-2 font-bold">{sSurname}</p>
      <p className="w-full text-center truncate">{sName}</p>
      <p className="flex w-full justify-center items-center py-2">
        {capitalizeFirst(
          t(DateFormat.Month, {
            date: thisMonth,
          })
        )}
        :
        <p className="text-gray-500 text-center truncate bg-teal-100 p-1 rounded-lg mx-1">
          {customer.bookingStats ? customer.bookingStats.thisMonthIce : 0} hrs
        </p>
        <p className="text-gray-500 text-center truncate bg-yellow-100 p-1 rounded-lg">
          {customer.bookingStats ? customer.bookingStats.thisMonthOffIce : 0}{" "}
          hrs
        </p>
      </p>

      <p className="flex w-full justify-center items-center">
        {capitalizeFirst(
          t(DateFormat.Month, {
            date: nextMonth,
          })
        )}
        :
        <p className="text-gray-500 text-center truncate bg-teal-100 mx-1 p-1 rounded-lg">
          {customer.bookingStats ? customer.bookingStats.nextMonthIce : 0} hrs
        </p>
        <p className="text-gray-500 text-center truncate bg-yellow-100 p-1 rounded-lg">
          {customer.bookingStats ? customer.bookingStats.nextMonthOffIce : 0}{" "}
          hrs
        </p>
      </p>
    </div>
  );
};

export default CustomerGridItem;
