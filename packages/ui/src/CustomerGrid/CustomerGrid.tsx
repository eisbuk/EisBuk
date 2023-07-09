import React from "react";

import { Customer, CustomerFull } from "@eisbuk/shared";

import { testId } from "@eisbuk/testing/testIds";

import CustomerGridItem from "./CustomerGridItem";

interface CustomerGridProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  customers?: CustomerFull[];
  filterString?: string;
  onCustomerClick?: (customer: Customer) => void;
}

const CustomerGrid: React.FC<CustomerGridProps> = ({
  customers,
  filterString = "",
  onCustomerClick = () => {},
  ...props
}) => {
  const filterRegex = new RegExp(filterString, "i");

  return (
    <div {...props}>
      <div
        className="w-full h-full flex gap-4 flex-wrap justify-start"
        data-testid={testId("customer-grid")}
      >
        {customers?.map(
          (customer, i) =>
            (filterRegex.test(customer.name) ||
              filterRegex.test(customer.surname)) &&
            !customer.deleted && (
              <CustomerGridItem
                key={customer.id || `temp-key-${i}`}
                onClick={(customer) => onCustomerClick(customer)}
                {...customer}
              />
            )
        )}
      </div>
    </div>
  );
};

export default CustomerGrid;
