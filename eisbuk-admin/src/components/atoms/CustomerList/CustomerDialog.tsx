import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";

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
import {
  CategoryLabel,
  CustomerActionButtons,
  CustomerLabel,
  Prompt,
} from "@/enums/translations";

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
import Button from "@material-ui/core/Button";

interface Props {
  customer: Customer | null;
  onClick?: (customer: Customer) => void;
  onClose: () => void;
}

const CustomerDialog: React.FC<Props> = ({ onClose, customer }) => {
  const { t } = useTranslation();
  const classes = useStyles();

  return (
    <Dialog
      data-testid={__customersDialogId__}
      open={Boolean(customer)}
      onClose={onClose}
    >
      <Card>
        <CardContent className={classes.CardContent}>
          <Box className={classes.Box}>
            <EisbukAvatar
              {...{ ...customer!, className: classes.BiggerAvatar }}
            />
            <div className={classes.NameContainer}>
              <Typography variant="h4" className={classes.Name}>
                {customer?.name}
              </Typography>
              <Typography variant="h4" className={classes.Name}>
                {customer?.surname}
              </Typography>
            </div>
          </Box>
          <br />
          <Typography variant="h6" component="div">
            <span className={classes.BoldLabel}>
              {t(CustomerLabel.Category)}:{" "}
            </span>
            {capitalizeFirst(
              t(CategoryLabel[customer?.category || ""])
            ).replace("-", " ")}
          </Typography>
          <Typography variant="h6">
            <span className={classes.BoldLabel}>
              {t(CustomerLabel.Email)}:{" "}
            </span>
            {customer?.email}
          </Typography>
          <Typography variant="h6">
            <span className={classes.BoldLabel}>
              {" "}
              {t(CustomerLabel.DateOfBirth)}:{" "}
            </span>
            {customer?.birthday}
          </Typography>
          <Typography variant="h6">
            <span className={classes.BoldLabel}>
              {" "}
              {t(CustomerLabel.Phone)}:{" "}
            </span>
            {customer?.phone}
          </Typography>
          <Typography variant="h6">
            <span className={classes.BoldLabel}>
              {" "}
              {t(CustomerLabel.CardNumber)}:{" "}
            </span>
            {customer?.subscriptionNumber || "-"}
          </Typography>
          <Typography variant="h6">
            <span className={classes.BoldLabel}>
              {" "}
              {t(CustomerLabel.MedicalCertificate)}:{" "}
            </span>
            {customer?.certificateExpiration}
          </Typography>
          <Typography variant="h6">
            <span className={classes.BoldLabel}>
              {" "}
              {t(CustomerLabel.CovidCertificateReleaseDate)}:{" "}
            </span>
            {customer?.covidCertificateReleaseDate}
          </Typography>
        </CardContent>
        <CardActions className={classes.CardActions}>
          <ActionButtons customer={customer} onClose={onClose} />
        </CardActions>
      </Card>
    </Dialog>
  );
};

/**
 * Action buttons for customer operations
 */
const ActionButtons: React.FC<Omit<Props, "open">> = ({
  customer,
  onClose,
}) => {
  const { t } = useTranslation();

  const dispatch = useDispatch();
  const history = useHistory();

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
  // redirect to customers `bookings` entry flow
  const bookingsRoute = `${Routes.CustomerArea}/${customer?.secretKey}`;
  const redirectToBookings = () => history.push(bookingsRoute);

  // send booking link flow
  const [sendMailDialog, setSendMailDialog] = useState(false);
  const sendMailPromptMessage = `${t(Prompt.ConfirmEmail)} ${
    customer?.email
  } ?`;
  const sendBookingsEmail = () => {
    onClose();
    customer && dispatch(sendBookingsLink(customer.id));
  };

  return (
    <>
      <Button
        color="primary"
        onClick={() => setDeleteDialog(true)}
        data-testid={__customerDeleteId__}
        variant="contained"
      >
        <DeleteIcon style={{ paddingRight: "5px" }} />
        {t(CustomerActionButtons.Delete)}
      </Button>
      <Button
        aria-label="edit"
        color="primary"
        onClick={openCustomerForm}
        data-testid={__customerEditId__}
        variant="contained"
      >
        <EditIcon style={{ paddingRight: "5px" }} />
        {t(CustomerActionButtons.Edit)}
      </Button>
      <Button
        color="primary"
        onClick={redirectToBookings}
        data-testid={__openBookingsId__}
        variant="contained"
      >
        <DateRangeIcon style={{ paddingRight: "5px" }} />
        {t(CustomerActionButtons.Bookings)}
      </Button>
      <Button
        color="primary"
        onClick={() => setSendMailDialog(true)}
        data-testid={__sendBookingsEmailId__}
        variant="contained"
        // disable button if email or secret key not provided
        disabled={!(customer?.email && customer?.secretKey)}
      >
        <Mail style={{ paddingRight: "5px" }} />
        {t(CustomerActionButtons.SendEmail)}
      </Button>

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
        customer={customer!}
        onClose={closeCustomerForm}
      />
    </>
  );
};

const useStyles = makeStyles(() => ({
  CursorPointer: { cursor: "pointer" },
  CardActions: {
    justifyContent: "center",
  },
  CardContent: {
    width: "40rem",
    display: "flex",
    flexDirection: "column",
  },
  BiggerAvatar: {
    width: "5rem",
    height: "5rem",
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
  BoldLabel: {
    fontWeight: "bold",
  },
  NameContainer: {
    display: "flex",
    flexDirection: "column",
  },
}));

export default CustomerDialog;
