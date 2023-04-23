import React from "react";

import { Customer } from "@eisbuk/shared";

import { CustomerAvatar } from "../UserAvatar";

interface Props extends Customer {
  onClick?: (customer: Customer) => void;
}

const CustomerListItem: React.FC<Props> = ({
  onClick = () => {},
  ...customer
}) => {
  const handleClick = () => onClick(customer);

  return (
    <tr
      onClick={handleClick}
      className="cursor-pointer h-12 table-row align-middle border-b"
    >
      <td className="pl-4 px-1.5 py-4">
        <div className="flex">
          <CustomerAvatar className="w-12 h-12" customer={customer} />
        </div>
      </td>
      <td className="px-1.5 py-4">{customer.name}</td>
      <td className="px-1.5 py-4">{customer.surname}</td>
    </tr>
  );
};

export default CustomerListItem;
