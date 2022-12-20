import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { CustomerProfileForm } from "@eisbuk/ui";
import { Customer } from "@eisbuk/shared";

import { getBookingsCustomer } from "@/store/selectors/bookings";
import { customerSelfUpdate } from "@/store/actions/bookingOperations";

import { getSecretKey } from "@/store/selectors/app";

const CalendarView: React.FC = () => {
  const dispatch = useDispatch();
  const secretKey = useSelector(getSecretKey)!;

  const customer = useSelector(getBookingsCustomer) || ({} as Customer);

  return (
    <CustomerProfileForm
      customer={customer}
      onSave={(customer) =>
        dispatch(
          customerSelfUpdate({
            ...customer,
            secretKey,
          })
        )
      }
    />
  );
};

export default CalendarView;
