import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { CustomerProfileForm } from "@eisbuk/ui";

import { getCustomer } from "@/store/selectors/customers";
import { updateCustomer } from "@/store/actions/customerOperations";

import { useSecretKey } from "../hooks";

const CalendarView: React.FC = () => {
  const dispatch = useDispatch();
  const secretKey = useSecretKey();

  const customer = useSelector(getCustomer(secretKey));

  return (
    <CustomerProfileForm
      customer={customer}
      onSave={(customer) => dispatch(updateCustomer(customer))}
    />
  );
};

export default CalendarView;
