import React from "react";

import { CustomerFull } from "@eisbuk/shared";
import { useTranslation, MessageTemplateLabel } from "@eisbuk/translations";
import { Ice, OffIce } from "@eisbuk/svg";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  customers?: CustomerFull[];
  selectedCustomerIds?: string[];
  onCustomerClick: (customer: CustomerFull) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  isOpen: boolean;
  monthStr: string;
}

const CustomerList: React.FC<Props> = ({
  customers = [],
  selectedCustomerIds = [],
  onCustomerClick = () => {},
  onSelectAll = () => {},
  onClearAll = () => {},
  isOpen,
  monthStr,
}) => {
  const { t } = useTranslation();

  return (
    <div>
      {isOpen && (
        <div className="absolute z-50 mt-2 w-96 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1 h-64 overflow-y-auto">
            <div className="flex items-center">
              <button
                className="text-sm text-gray-600 px-4 py-2 hover:bg-gray-100 w-full"
                onClick={onSelectAll}
                type="button"
              >
                {t(MessageTemplateLabel.SelectAll)}
              </button>
              <button
                className="text-sm text-gray-600 px-4 py-2 hover:bg-gray-100 w-full"
                onClick={onClearAll}
                type="button"
              >
                {t(MessageTemplateLabel.SelectNone)}
              </button>
            </div>
            {customers.map((customer) => (
              <label
                key={customer.id}
                className="flex items-center justify-between px-4 py-2"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-cyan-600"
                    checked={selectedCustomerIds.includes(customer.id)}
                    onChange={() => onCustomerClick(customer)}
                  />
                  <span className="ml-2 text-gray-700">
                    {customer.surname} {customer.name}
                  </span>
                </div>

                <div className="flex items-center justify-end text-gray-500">
                  <div className="flex items-center w-16">
                    <div className="h-4 ">
                      <Ice />
                    </div>

                    {customer.bookingStats?.[monthStr]?.ice || " - "}
                  </div>
                  <div className="flex items-center w-16">
                    <div className="h-4">
                      <OffIce />
                    </div>
                    {customer.bookingStats?.[monthStr]?.["off-ice"] || " - "}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
