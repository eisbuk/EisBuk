import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";

import CardActions from "@material-ui/core/CardActions";
import IconButton from "@material-ui/core/IconButton";

import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";

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
      >
        <EditIcon />
      </IconButton>
      <IconButton
        aria-label="delete"
        onClick={() => setDeleteDialog(true)}
        data-testid={__customerDeleteId__}
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
