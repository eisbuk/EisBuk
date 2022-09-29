import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { CustomerProfileForm } from "@eisbuk/ui";
import { Customer } from "@eisbuk/shared";

import { getBookingsCustomer } from "@/store/selectors/bookings";
import { updateBookingCustomer } from "@/store/actions/bookingOperations";

import { useParams } from "react-router-dom";

const CalendarView: React.FC = () => {
  const dispatch = useDispatch();
  const { secretKey } = useParams<{ secretKey: string }>();

  const customer =
    useSelector(getBookingsCustomer) || ({} as Omit<Customer, "secretKey">);

  return (
    <>
      <CustomerProfileForm
        customer={customer}
        onSave={(customer) => {
          return dispatch(
            updateBookingCustomer({
              customer: { ...customer, secretKey },
            })
          );
        }}
      />
    </>
  );
};

export default CalendarView;
