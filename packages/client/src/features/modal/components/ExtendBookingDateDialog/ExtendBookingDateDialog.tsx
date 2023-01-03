import React from "react";
import { useDispatch } from "react-redux";

import { Customer } from "@eisbuk/shared";
import { ActionDialog } from "@eisbuk/ui";
import i18n, { ActionButton, Prompt } from "@eisbuk/translations";

import { BaseModalProps } from "../../types";

import { extendBookingDate } from "@/store/actions/customerOperations";
import { DateTime } from "luxon";

type ExtendBookingDateProps = BaseModalProps & Customer;

const ExtendBookingDateDialog: React.FC<ExtendBookingDateProps> = ({
  onClose,
  className,
  extendedDate,
  ...customer
}) => {
  const dispatch = useDispatch();

  const onConfirm = () => {
    dispatch(extendBookingDate(customer.id, extendedDate!));
    onClose();
  };

  const { name, surname } = customer;
  const title = i18n.t(Prompt.ExtendBookingDateTitle, {
    name,
    surname,
  });

  return (
    <ActionDialog
      onCancel={onClose}
      {...{ title, onConfirm, className }}
      cancelLabel={i18n.t(ActionButton.Cancel)}
      confirmLabel={i18n.t(ActionButton.ExtendBookingDate)}
    >
      <p className="mb-4 whitespace-wrap">
        {i18n.t(Prompt.ExtendBookingDateBody, {
          name,
          surname,
          extendedDate: DateTime.fromISO(extendedDate!),
        })}
      </p>
    </ActionDialog>
  );
};

export default ExtendBookingDateDialog;
