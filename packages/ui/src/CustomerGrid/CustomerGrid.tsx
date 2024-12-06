import React from "react";

import { Customer, CustomerFull } from "@eisbuk/shared";

import { testId } from "@eisbuk/testing/testIds";

import CustomerGridItem from "./CustomerGridItem";

interface CustomerGridProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  customers?: CustomerFull[];
  filterString?: string;
  approvalsOnly?: boolean;
  onCustomerClick?: (customer: Customer) => void;
}

const CustomerGrid: React.FC<CustomerGridProps> = ({
  customers,
  filterString = "",
  approvalsOnly = false,
  onCustomerClick = () => {},
  ...props
}) => {
  const filterRegex = new RegExp(filterString, "i");

  const customerMap = (customer: CustomerFull) =>
    (filterRegex.test(customer.name) || filterRegex.test(customer.surname)) &&
    !customer.deleted &&
    (!approvalsOnly || !customer.categories.length);

  return (
    <div {...props}>
      <div
        className="w-full h-full flex gap-4 flex-wrap justify-center md:justify-start"
        data-testid={testId("customer-grid")}
      >
        {customers?.map(
          (customer, i) =>
            customerMap(customer) && (
              <CustomerGridItem
                key={customer.id || `temp-key-${i}`}
                onClick={() => onCustomerClick(customer)}
                {...customer}
              />
            )
        )}
      </div>
    </div>
  );
};

export default CustomerGrid;
