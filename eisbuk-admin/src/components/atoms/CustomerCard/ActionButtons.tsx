import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";

import Button from "@material-ui/core/Button";

import makeStyles from "@material-ui/core/styles/makeStyles";

import DateRangeIcon from "@material-ui/icons/DateRange";
import Mail from "@material-ui/icons/Mail";

import { Routes } from "@/enums/routes";
import { ActionButton, Prompt } from "@/enums/translations";

import { ActionButtonProps } from "./types";

import ConfirmDialog from "@/components/global/ConfirmDialog";

import { sendBookingsLink } from "@/store/actions/customerOperations";

import {
  __openBookingsId__,
  __sendBookingsEmailId__,
} from "./__testData__/testIds";

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
        startIcon={<DateRangeIcon />}
        className={classes.actionButton}
        color="primary"
        onClick={redirectToBookings}
        data-testid={__openBookingsId__}
        variant="contained"
      >
        {t(ActionButton.CustomerBookings)}
      </Button>
      <Button
        startIcon={<Mail />}
        className={classes.actionButton}
        color="primary"
        onClick={() => setSendMailDialog(true)}
        data-testid={__sendBookingsEmailId__}
        variant="contained"
        // disable button if email or secret key not provided
        disabled={!(customer?.email && customer?.secretKey)}
      >
        {t(ActionButton.SendBookingsEmail)}
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
  actionButton: {
    marginRight: "0.5rem",
  },
}));

export default ActionButtons;
