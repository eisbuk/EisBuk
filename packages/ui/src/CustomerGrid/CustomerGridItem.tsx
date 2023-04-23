import React from "react";

import { Customer } from "@eisbuk/shared";

import { CustomerAvatar, BadgeSize } from "../UserAvatar";

export interface GridItemProps extends Customer {
  onClick?: (customer: Customer) => void;
}

const CustomerGridItem: React.FC<GridItemProps> = ({
  onClick = () => {},
  ...customer
}) => {
  const customerValidated = customer.categories.length > 0;

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
      <p className="w-full text-center truncate">{customer.name}</p>
      <p className="w-full text-center truncate">{customer.surname}</p>
    </div>
  );
};

export default CustomerGridItem;
