import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";

import CardActions from "@mui/material/CardActions";
import IconButton from "@mui/material/IconButton";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

import { Customer } from "eisbuk-shared";

import { Prompt } from "@/enums/translations";

import { ActionButtonProps } from "./types";

import ConfirmDialog from "@/components/global/ConfirmDialog";
import CustomerForm from "@/components/customers/CustomerForm";

import {
  deleteCustomer,
  updateCustomer,
} from "@/store/actions/customerOperations";

import {
  __customerDeleteId__,
  __customerEditId__,
} from "./__testData__/testIds";

/**
 * Action buttons for customer operations, rendered as icon buttons (without text)
 */
const CustomerOperationButtons: React.FC<ActionButtonProps> = ({
  customer,
  onClose,
  className,
}) => {
  const { t } = useTranslation();

  const dispatch = useDispatch();

  // delete customer flow
  const [deleteDialog, setDeleteDialog] = useState(false);
  const deleteDialogPrompt = `${t(Prompt.DeleteCustomer)} ${customer?.name} ${
    customer?.surname
  }?`;
  const confirmDelete = () => {
    onClose();
    customer && dispatch(deleteCustomer(customer));
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
        onClick={() => setDeleteDialog(true)}
        data-testid={__customerDeleteId__}
        size="large"
      >
        <DeleteIcon />
      </IconButton>

      <ConfirmDialog
        open={deleteDialog}
        title={deleteDialogPrompt}
        setOpen={setDeleteDialog}
        onConfirm={confirmDelete}
      >
        {t(Prompt.NonReversible)}
      </ConfirmDialog>

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
