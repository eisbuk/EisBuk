import React from "react";

import { Customer } from "@eisbuk/shared";

import { CustomerAvatar, BadgeSize } from "../UserAvatar";

import { shortName } from "../utils/helpers";

export interface GridItemProps extends Customer {
  onClick?: (customer: Customer) => void;
}

const CustomerGridItem: React.FC<GridItemProps> = ({
  onClick = () => {},
  ...customer
}) => {
  const customerValidated = customer.categories.length > 0;

  const [sName, sSurname] = shortName(customer.name, customer.surname);

  return (
    <div
      style={
        customerValidated ? {} : { opacity: 0.5, filter: "grayscale(90%)" }
      }
      onClick={() => onClick(customer)}
      className="border-box w-32 h-36 p-1 flex items-center flex-col cursor-pointer"
    >
      <CustomerAvatar
        badgeSize={BadgeSize.LG}
        className="w-20 h-20 mb-2"
        {...{ customer }}
      />
      <p className="w-full text-center truncate">{sName}</p>
      <p className="w-full text-center truncate">{sSurname}</p>
    </div>
  );
};

export default CustomerGridItem;
