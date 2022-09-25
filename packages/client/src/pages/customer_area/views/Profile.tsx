import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { CustomerProfileForm } from "@eisbuk/ui";
import { Customer } from "@eisbuk/shared";

import { getBookingsCustomer } from "@/store/selectors/bookings";
import { updateBookingCustomer } from "@/store/actions/bookingOperations";

import { useSecretKey } from "../hooks";

const CalendarView: React.FC = () => {
  const dispatch = useDispatch();
  const secretKey = useSecretKey();

  const customer =
    useSelector(getBookingsCustomer) || ({} as Omit<Customer, "secretKey">);

  return (
    <>
      <CustomerProfileForm
        customer={customer}
        onSave={(customer) => {
          return dispatch(
            updateBookingCustomer({
              secretKey,
              customer: { ...customer, secretKey },
            })
          );
        }}
      />
    </>
  );
};

export default CalendarView;
