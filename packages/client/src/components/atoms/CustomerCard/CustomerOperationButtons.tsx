import React from "react";

import CardActions from "@mui/material/CardActions";
import IconButton from "@mui/material/IconButton";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

import { ActionButtonProps } from "./types";

import { createModal } from "@/features/modal/useModal";

import {
  __customerDeleteId__,
  __customerEditId__,
} from "./__testData__/testIds";

/**
 * Action buttons for customer operations, rendered as icon buttons (without text)
 */
const CustomerOperationButtons: React.FC<ActionButtonProps> = ({
  customer,
  className,
}) => {
  const { openWithProps: openCustomerForm } = useCustomerFormModal();
  const { openWithProps: openDeleteCustomerDialog } = useDeleteCustomerModal();

  const handleDelete = () => openDeleteCustomerDialog(customer);

  const handleEditCustoer = () => openCustomerForm({ customer });

  return (
    <CardActions {...{ className }}>
      <IconButton
        aria-label="edit"
        onClick={handleEditCustoer}
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
    </CardActions>
  );
};

const useCustomerFormModal = createModal("CustomerFormDialog");
const useDeleteCustomerModal = createModal("DeleteCustomerDialog");

export default CustomerOperationButtons;
