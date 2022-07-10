import React, { useState } from "react";
import { useDispatch } from "react-redux";

import CardActions from "@mui/material/CardActions";
import IconButton from "@mui/material/IconButton";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

import { Customer } from "@eisbuk/shared";

import { ActionButtonProps } from "./types";

import CustomerForm from "@/components/customers/CustomerForm";

import { updateCustomer } from "@/store/actions/customerOperations";

import {
  __customerDeleteId__,
  __customerEditId__,
} from "./__testData__/testIds";
import { openModal } from "@/features/modal/actions";

/**
 * Action buttons for customer operations, rendered as icon buttons (without text)
 */
const CustomerOperationButtons: React.FC<ActionButtonProps> = ({
  customer,
  onClose,
  className,
}) => {
  const dispatch = useDispatch();

  // delete customer flow
  const handleDelete = () => {
    dispatch(openModal({ component: "DeleteCustomerDialog", props: customer }));
  };

  // edit customer flow
  const [editCustomer, setEditCustomer] = useState(false);
  const openCustomerForm = () => setEditCustomer(true);
  const closeCustomerForm = () => setEditCustomer(false);
  const handleSubmit = (customer: Customer) => {
    onClose();
    dispatch(updateCustomer(customer));
  };

  return (
    <CardActions {...{ className }}>
      <IconButton
        aria-label="edit"
        onClick={openCustomerForm}
        data-testid={__customerEditId__}
        size="large"
      >
        <EditIcon />
      </IconButton>
      <IconButton
        aria-label="delete"
        onClick={handleDelete}
        data-testid={__customerDeleteId__}
        size="large"
      >
        <DeleteIcon />
      </IconButton>

      <CustomerForm
        updateCustomer={handleSubmit}
        open={editCustomer}
        customer={customer!}
        onClose={closeCustomerForm}
      />
    </CardActions>
  );
};

export default CustomerOperationButtons;
