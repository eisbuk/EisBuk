import React from "react";
import { useDispatch } from "react-redux";

import { Customer } from "@eisbuk/shared";
import { ActionDialog } from "@eisbuk/ui";
import i18n, { ActionButton, Prompt } from "@eisbuk/translations";

import { BaseModalProps } from "../../types";

import { deleteCustomer } from "@/store/actions/customerOperations";

type DeleteCustomerProps = BaseModalProps & Customer;

const DeleteCustomerDialog: React.FC<DeleteCustomerProps> = ({
  onClose,
  className,
  ...customer
}) => {
  const dispatch = useDispatch();

  const onConfirm = () => {
    dispatch(deleteCustomer(customer));
    onClose();
  };

  const title = `${i18n.t(Prompt.DeleteCustomer)} ${customer?.name} ${
    customer?.surname
  }?`;

  const body = i18n.t(Prompt.NonReversible);

  return (
    <ActionDialog
      onCancel={onClose}
      {...{ title, onConfirm, className }}
      cancelLabel={i18n.t(ActionButton.Cancel)}
    >
      {body}
    </ActionDialog>
  );
};

export default DeleteCustomerDialog;
