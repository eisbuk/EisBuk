import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";

import IconButton from "@material-ui/core/IconButton";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Dialog from "@material-ui/core/Dialog";

import makeStyles from "@material-ui/core/styles/makeStyles";

import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import DateRangeIcon from "@material-ui/icons/DateRange";
import Mail from "@material-ui/icons/Mail";

import { Customer } from "eisbuk-shared";

import { Routes } from "@/enums/routes";
import { CategoryLabel, CustomerLabel, Prompt } from "@/enums/translations";

import EisbukAvatar from "@/components/users/EisbukAvatar";
import ConfirmDialog from "@/components/global/ConfirmDialog";
import CustomerForm from "@/components/customers/CustomerForm";

import {
  deleteCustomer,
  sendBookingsLink,
  updateCustomer,
} from "@/store/actions/customerOperations";

import { capitalizeFirst } from "@/utils/helpers";
import {
  __customerDeleteId__,
  __customerEditId__,
  __openBookingsId__,
  __sendBookingsEmailId__,
} from "./__testData__/testIds";
import { __customersDialogId__ } from "@/__testData__/testIds";

interface Props {
  customer: Customer;
  onClick?: (customer: Customer) => void;
  onClose: () => void;
  open: boolean;
}

const CustomerDialog: React.FC<Props> = ({ open, onClose, customer }) => {
  const { t } = useTranslation();
  const classes = useStyles();

  return (
    <Dialog data-testid={__customersDialogId__} open={open} onClose={onClose}>
      <Card className={classes.Card}>
        <CardContent className={classes.CardContent}>
          <Box className={classes.Box}>
            {/* {extended && <AdditionalButtons {...customer} />} */}
            <EisbukAvatar
              {...{ ...customer, className: classes.BiggerAvatar }}
            />
            <Typography variant="h4" className={classes.Name}>
              {customer.name} {customer.surname}
            </Typography>
          </Box>

          <br></br>
          <Typography variant="h6" component="div">
            {t(CustomerLabel.Category)}:{" "}
            {capitalizeFirst(t(CategoryLabel[customer.category])).replace(
              "-",
              " "
            )}
          </Typography>
          <Typography variant="h6">
            {t(CustomerLabel.Email)}: {customer.email}
          </Typography>
        </CardContent>
        <CardActions className={classes.CardActions}>
          <AdditionalButtons customer={customer} onClose={onClose} />
        </CardActions>
      </Card>
    </Dialog>
  );
};

/**
 * Action buttons for customer operations, used only on `extended` variant.
 */
const AdditionalButtons: React.FC<Omit<Props, "open">> = ({
  customer,
  onClose,
}) => {
  const { t } = useTranslation();

  const dispatch = useDispatch();
  const history = useHistory();

  // delete customer flow
  const [deleteDialog, setDeleteDialog] = useState(false);
  const deleteDialogPrompt = `${t(Prompt.DeleteCustomer)} ${customer.name} ${
    customer.surname
  }?`;
  const confirmDelete = () => {
    onClose();
    dispatch(deleteCustomer(customer));
  };

  // edit customer flow
  const [editCustomer, setEditCustomer] = useState(false);
  const openCustomerForm = () => setEditCustomer(true);
  const closeCustomerForm = () => setEditCustomer(false);
  const handleSubmit = (customer: Customer) => {
    onClose();
    dispatch(updateCustomer(customer));
  };
  // redirect to customers `bookings` entry flow
  const bookingsRoute = `${Routes.CustomerArea}/${customer.secretKey}`;
  const redirectToBookings = () => history.push(bookingsRoute);

  // send booking link flow
  const [sendMailDialog, setSendMailDialog] = useState(false);
  const sendMailPromptMessage = `${t(Prompt.ConfirmEmail)} ${customer.email} ?`;
  const sendBookingsEmail = () => {
    onClose();
    dispatch(sendBookingsLink(customer.id));
  };

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
      <IconButton
        color="primary"
        onClick={() => setSendMailDialog(true)}
        data-testid={__sendBookingsEmailId__}
        // disable button if email or secret key not provided
        disabled={!(customer.email && customer.secretKey)}
      >
        <Mail />
      </IconButton>

      <ConfirmDialog
        open={deleteDialog}
        title={deleteDialogPrompt}
        setOpen={setDeleteDialog}
        onConfirm={confirmDelete}
      >
        {t(Prompt.NonReversible)}
      </ConfirmDialog>
      <ConfirmDialog
        open={sendMailDialog}
        title={t(Prompt.SendEmailTitle)}
        setOpen={setSendMailDialog}
        onConfirm={sendBookingsEmail}
      >
        {sendMailPromptMessage}
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

const useStyles = makeStyles(() => ({
  CursorPointer: { cursor: "pointer" },
  Card: {
    width: "35rem",
    // padding: "1rem",
  },
  CardActions: {
    justifyContent: "center",
  },
  CardContent: {
    display: "flex",
    flexDirection: "column",
  },
  BiggerAvatar: {
    width: "5rem",
    height: "5rem",
    // marginRight: "1rem",
    // borderRadius: "100%",
  },
  Name: {
    paddingLeft: "1.5rem",
  },
  Box: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: "1rem",
  },
}));

export default CustomerDialog;
