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
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";

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

interface Props {
  customer: Customer | null;
  onClick?: (customer: Customer) => void;
  onClose: () => void;
}

const CustomerDialog: React.FC<Props> = ({ onClose, customer }) => {
  const { t } = useTranslation();
  const classes = useStyles();

  /**
   * A render function used to automate rendering of
   * customer's record values
   * @param customer
   */
  const renderCustomerData = (customer: Customer): JSX.Element => {
    const renderOrder: (keyof Customer)[] = [
      "name",
      "surname",
      "category",
      "email",
      "phone",
      "birthday",
      "certificateExpiration",
      "covidCertificateReleaseDate",
    ];

    return (
      <>
        {renderOrder.map((property) => {
          /** We're using capitalize first to transform customer property into appropriate i18n key */
          const translatedLabel = t(CustomerLabel[capitalizeFirst(property)]);

          const value =
            // if we're rendering category we're applying special formating as
            // translations of multi-word categories are "-" separeted lowercased words
            property === "category"
              ? capitalizeFirst(t(CategoryLabel[customer.category])).replace(
                  "-",
                  " "
                )
              : customer[property] || "-";

          return (
            <Typography variant="h6">
              <span className={classes.bold}>{translatedLabel}: </span>
              {value}
            </Typography>
          );
        })}
      </>
    );
  };

  return (
    <Dialog
      maxWidth="lg"
      data-testid={__customersDialogId__}
      open={Boolean(customer)}
      onClose={onClose}
    >
      <Card>
        <CardContent className={classes.CardContent}>
          <Box className={classes.topSection}>
            <EisbukAvatar {...{ ...customer!, className: classes.avatar }} />
            <div className={classes.nameContainer}>
              <Typography variant="h4" className={classes.bold}>
                {customer?.name}
              </Typography>
              <Typography variant="h4">{customer?.surname}</Typography>
              <CustomerOperationButtons
                customer={customer!}
                className={classes.customerOperationsContainer}
                {...{ onClose }}
              />
            </div>
          </Box>
          <br />
          {renderCustomerData(customer!)}
        </CardContent>
        <ActionButtons
          className={classes.actionButtonsContainer}
          customer={customer!}
          onClose={onClose}
        />
      </Card>
    </Dialog>
  );
};

interface ActionButtonProps {
  customer: Customer;
  onClose: () => void;
  className?: string;
}

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
        aria-label="delete"
        onClick={() => setDeleteDialog(true)}
        data-testid={__customerDeleteId__}
      >
        <DeleteIcon />
      </IconButton>
      <IconButton
        aria-label="edit"
        onClick={openCustomerForm}
        data-testid={__customerEditId__}
      >
        <EditIcon />
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

/**
 * Labeled action buttons to open customer's bookings or send
 * booking link via sms/email, rendered as icon + text
 */
const ActionButtons: React.FC<ActionButtonProps> = ({
  customer,
  onClose,
  className,
}) => {
  const { t } = useTranslation();

  const dispatch = useDispatch();
  const history = useHistory();

  const classes = useStyles();

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
    <div {...{ className }}>
      <Button
        className={classes.actionButton}
        color="primary"
        onClick={redirectToBookings}
        data-testid={__openBookingsId__}
        variant="contained"
      >
        <DateRangeIcon style={{ paddingRight: "5px" }} />
        {t(CustomerActionButtons.Bookings)}
      </Button>
      <Button
        className={classes.actionButton}
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
        open={sendMailDialog}
        title={t(Prompt.SendEmailTitle)}
        setOpen={setSendMailDialog}
        onConfirm={sendBookingsEmail}
      >
        {sendMailPromptMessage}
      </ConfirmDialog>
    </div>
  );
};

const useStyles = makeStyles(() => ({
  CursorPointer: { cursor: "pointer" },
  actionButtonsContainer: {
    width: "100%",
    padding: "1rem",
    boxSizing: "border-box",
    justifyContent: "center",
  },
  CardContent: {
    display: "flex",
    flexDirection: "column",
  },
  avatar: {
    width: "5rem",
    height: "5rem",
  },
  topSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "start",
    marginBottom: "1rem",
  },
  bold: {
    fontWeight: "bold",
  },
  nameContainer: {
    marginLeft: "1rem",
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  customerOperationsContainer: {
    position: "absolute",
    top: "-1rem",
    right: "-1rem",
    transform: "translateX(100%)",
  },
  actionButton: {
    "&:first-child": {
      marginRight: "5px",
    },
  },
}));

export default CustomerDialog;
