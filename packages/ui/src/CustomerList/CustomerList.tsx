import React from "react";

import { CustomerFull, Customer, __customerListId__ } from "@eisbuk/shared";
import { useTranslation, CustomerLabel } from "@eisbuk/translations";

import CustomerListItem from "./CustomerListItem";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  customers?: CustomerFull[];
  filterString?: string;
  onCustomerClick?: (customer: Customer) => void;
}

const CustomerList: React.FC<Props> = ({
  customers,
  filterString = "",
  onCustomerClick = () => {},
  ...props
}) => {
  const { t } = useTranslation();

  const filterRegex = new RegExp(filterString, "i");

  return (
    <div className="overflow-auto w-full" {...props}>
      <table className="w-full border-collapse table-fixed">
        <thead className="table-header-group">
          <tr className="h-12 table-row align-middle border-b">
            <th className="pl-4 text-left px-1.5 py-4"></th>
            <th className="text-left px-1.5 py-4">{t(CustomerLabel.Name)}</th>
            <th className="text-left px-1.5 py-4">
              {t(CustomerLabel.Surname)}
            </th>
          </tr>
        </thead>
        <tbody data-testid={__customerListId__}>
          {customers?.map(
            (customer, i) =>
              (filterRegex.test(customer.name) ||
                filterRegex.test(customer.surname)) &&
              !customer.deleted && (
                <CustomerListItem
                  key={customer.id || `temp-key-${i}`}
                  onClick={onCustomerClick}
                  {...customer}
                />
              )
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerList;
