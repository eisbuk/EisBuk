import React, { useState } from "react";
import { useDispatch } from "react-redux";

import { Customer } from "@eisbuk/shared";
import { ActionDialog } from "@eisbuk/ui";
import i18n, { ActionButton, Prompt } from "@eisbuk/translations";

import { BaseModalProps } from "../../types";

import { DateInput } from "@/components/atoms/DateInput";

import { extendBookingDate } from "@/store/actions/customerOperations";

type ExtendBookingDateProps = BaseModalProps & Customer;

const ExtendBookingDateDialog: React.FC<ExtendBookingDateProps> = ({
  onClose,
  className,
  ...customer
}) => {
  const dispatch = useDispatch();

  const onConfirm = () => {
    dispatch(extendBookingDate(customer.id, extendedDateInput));
    onClose();
  };

  const [extendedDateInput, setExtendedDateInput] = useState("");

  const title = i18n.t(Prompt.ExtendBookingDateTitle, {
    customer: `${customer.name} ${customer.surname}`,
  });

  const body = (
    <>
      <p>
        {i18n.t(Prompt.ExtendBookingDateBody, {
          customer: `${customer.name} ${customer.surname}`,
        })}
      </p>
      <DateInput
        value={extendedDateInput}
        onChange={(value) => setExtendedDateInput(value)}
      />
    </>
  );

  return (
    <ActionDialog
      onCancel={onClose}
      {...{ title, onConfirm, className }}
      cancelLabel={i18n.t(ActionButton.Cancel)}
      confirmLabel={i18n.t(ActionButton.ExtendBookingDate)}
    >
      {body}
    </ActionDialog>
  );
};

export default ExtendBookingDateDialog;
