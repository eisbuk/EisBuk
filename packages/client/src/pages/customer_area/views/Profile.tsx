import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { CustomerForm } from "@eisbuk/ui";
import { Customer } from "@eisbuk/shared";

import { getBookingsCustomer } from "@/store/selectors/bookings";
import { customerSelfUpdate } from "@/store/actions/bookingOperations";

import { getSecretKey } from "@/store/selectors/app";
import { getDefaultCountryCode } from "@/store/selectors/orgInfo";

const CalendarView: React.FC = () => {
  const dispatch = useDispatch();

  const secretKey = useSelector(getSecretKey)!;
  const defaultCountryCode = useSelector(getDefaultCountryCode);

  const customer =
    useSelector(getBookingsCustomer(secretKey)) || ({} as Customer);

  return (
    <div className="px-[44px] py-4">
      <CustomerForm.Profile
        customer={customer}
        onSave={(customer) => {
          dispatch(
            customerSelfUpdate({
              ...customer,
              secretKey,
            })
          );
        }}
        defaultDialCode={defaultCountryCode}
      />
    </div>
  );
};

export default CalendarView;
