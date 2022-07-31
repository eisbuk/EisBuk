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
  onCloseAll,
  className,
  ...customer
}) => {
  const dispatch = useDispatch();

  const onConfirm = () => {
    dispatch(deleteCustomer(customer));
    onCloseAll();
  };

  const { name, surname } = customer;
  const title = i18n.t(Prompt.DeleteCustomer, { name, surname });

  const body = i18n.t(Prompt.NonReversible);

  return (
    <ActionDialog
      onCancel={onClose}
      {...{ title, onConfirm, className }}
      cancelLabel={i18n.t(ActionButton.Cancel)}
      confirmLabel={i18n.t(ActionButton.Delete)}
    >
      {body}
    </ActionDialog>
  );
};

export default DeleteCustomerDialog;
