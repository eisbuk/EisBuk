import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";

import IconButton from "@material-ui/core/IconButton";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import Box from "@material-ui/core/Box";

import makeStyles from "@material-ui/core/styles/makeStyles";

import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import DateRangeIcon from "@material-ui/icons/DateRange";

import { Customer } from "eisbuk-shared";

import { Prompt } from "@/lib/labels";

import { Routes } from "@/enums/routes";

import EisbukAvatar from "@/components/users/EisbukAvatar";
import ConfirmDialog from "@/components/global/ConfirmDialog";
import CustomerForm from "@/components/customers/CustomerForm";

import {
  deleteCustomer,
  updateCustomer,
} from "@/store/actions/customerOperations";

import { capitalizeFirst } from "@/utils/helpers";
import {
  __customerDeleteId__,
  __customerEditId__,
  __openBookingsId__,
} from "./__testData__/testIds";

interface Props extends Customer {
  extended?: boolean;
  onClick?: (customer: Customer) => void;
}

const CustomerListItem: React.FC<Props> = ({
  extended = false,
  onClick = () => {},
  ...customer
}) => {
  const { t } = useTranslation();
  const classes = useStyles();

  const extendedCells = (
    <>
      <TableCell>
        {capitalizeFirst(t(`Categories.${customer.category}`))}
      </TableCell>
      <TableCell>{customer.email}</TableCell>
    </>
  );

  const handleClick = extended ? () => {} : () => onClick(customer);

  return (
    <TableRow
      onClick={handleClick}
      className={extended ? "" : classes.cursorPointer}
    >
      <TableCell>
        <Box display="flex" flexDirection="row">
          {extended && <AdditionalButtons {...customer} />}
          <EisbukAvatar {...customer} />
        </Box>
      </TableCell>
      <TableCell>{customer.name}</TableCell>
      <TableCell>{customer.surname}</TableCell>
      {extended && extendedCells}
    </TableRow>
  );
};

/**
 * Action buttons for customer operations, used only on `extended` variant.
 */
const AdditionalButtons: React.FC<Customer> = (customer) => {
  const { t } = useTranslation();

  const dispatch = useDispatch();
  const history = useHistory();

  // delete customer flow
  const [deleteDialog, setDeleteDialog] = useState(false);
  const deleteDialogPrompt = `${Prompt.DeleteCustomer} ${customer.name} ${customer.surname}?`;
  const confirmDelete = () => dispatch(deleteCustomer(customer));

  // edit customer flow
  const [editCustomer, setEditCustomer] = useState(false);
  const openCustomerForm = () => setEditCustomer(true);
  const closeCustomerForm = () => setEditCustomer(false);
  const handleSubmit = (customer: Customer) =>
    dispatch(updateCustomer(customer));

  // redirect to customers `bookings` entry flow
  const bookingsRoute = `${Routes.CustomerArea}/${customer.secretKey}`;
  const redirectToBookings = () => history.push(bookingsRoute);

  return (
    <>
      <IconButton
        color="primary"
        onClick={() => setDeleteDialog(true)}
        data-testid={__customerDeleteId__}
      >
        <DeleteIcon />
      </IconButton>
      <IconButton
        aria-label="edit"
        color="primary"
        onClick={openCustomerForm}
        data-testid={__customerEditId__}
      >
        <EditIcon />
      </IconButton>
      <IconButton
        color="primary"
        onClick={redirectToBookings}
        data-testid={__openBookingsId__}
      >
        <DateRangeIcon />
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
        customer={customer}
        onClose={closeCustomerForm}
      />
    </>
  );
};

const useStyles = makeStyles(() => ({ cursorPointer: { cursor: "pointer" } }));

export default CustomerListItem;
