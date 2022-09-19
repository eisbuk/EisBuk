import React from "react";
import { useDispatch } from "react-redux";

import { CustomerLoose } from "@eisbuk/shared";

import { BaseModalProps } from "../../types";

import CustomerForm, {
  CustomerFormProps,
} from "@/components/customers/CustomerForm";

import { updateCustomer } from "@/store/actions/customerOperations";

type CustomerFormDialogProps = BaseModalProps &
  Pick<CustomerFormProps, "customer" | "defaultDialCode">;

const CustomerFormDialog: React.FC<CustomerFormDialogProps> = ({
  onClose,
  ...customerFormProps
}) => {
  const dispatch = useDispatch();
  const handleUpdateCustomer = (customer: CustomerLoose) => {
    dispatch(updateCustomer(customer));
    onClose();
  };

  return (
    <CustomerForm
      onCancel={onClose}
      onUpdateCustomer={handleUpdateCustomer}
      {...customerFormProps}
    />
  );
};

export default CustomerFormDialog;
