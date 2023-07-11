import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

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

  const history = useHistory();

  const [toggled, setToggle] = useState(true);

  useEffect(() => {
    setToggle(
      history.location.search !== "" &&
        history.location.search === "?approvals=true"
    );
  }, [history.location.search]);

  const customerMap = (customer: CustomerFull) =>
    (filterRegex.test(customer.name) || filterRegex.test(customer.surname)) &&
    !customer.deleted &&
    (toggled ? customer.categories.length === 0 : true);

  return (
    <div {...props}>
      <div
        className="w-full h-full flex gap-4 flex-wrap justify-start"
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
