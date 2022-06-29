import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";

import Button from "@mui/material/Button";

import makeStyles from "@mui/styles/makeStyles";

import DateRangeIcon from "@mui/icons-material/DateRange";
import Mail from "@mui/icons-material/Mail";
import Phone from "@mui/icons-material/Phone";

import i18n, {
  useTranslation,
  ActionButton,
  Prompt,
} from "@eisbuk/translations";

import { Routes } from "@/enums/routes";
import { SendBookingLinkMethod } from "@/enums/other";

import { ActionButtonProps } from "./types";

import ConfirmDialog from "@/components/global/ConfirmDialog";

import { sendBookingsLink } from "@/store/actions/customerOperations";

import {
  __openBookingsId__,
  __sendBookingsEmailId__,
  __sendBookingsSMSId__,
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
  const [sendBookingsMethod, setSendBookingsMethod] =
    useState<SendBookingLinkMethod | null>(null);

  const { promptTitle, promptBody } = getDialogPrompt({
    method: sendBookingsMethod,
    email: customer.email,
    phone: customer.phone,
  });

  const bookingsLink = `https://${window.location.hostname}${Routes.CustomerArea}/${customer?.secretKey}`;
  const handleSendBookingsLink = (method: SendBookingLinkMethod) => {
    onClose();
    dispatch(
      sendBookingsLink({ customerId: customer.id, method, bookingsLink })
    );
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
        onClick={() => setSendBookingsMethod(SendBookingLinkMethod.Email)}
        data-testid={__sendBookingsEmailId__}
        variant="contained"
        // disable button if email or secret key not provided
        disabled={!(customer?.email && customer?.secretKey)}
      >
        {t(ActionButton.SendBookingsEmail)}
      </Button>
      <Button
        startIcon={<Phone />}
        className={classes.actionButton}
        color="primary"
        onClick={() => setSendBookingsMethod(SendBookingLinkMethod.SMS)}
        data-testid={__sendBookingsSMSId__}
        variant="contained"
        // disable button if phone number or secret key not provided
        disabled={!(customer?.phone && customer?.secretKey)}
      >
        {t(ActionButton.SendBookingsSMS)}
      </Button>

      <ConfirmDialog
        open={Boolean(sendBookingsMethod)}
        title={promptTitle}
        setOpen={(open: boolean) => (open ? null : setSendBookingsMethod(null))}
        onConfirm={() => handleSendBookingsLink(sendBookingsMethod!)}
      >
        {promptBody}
      </ConfirmDialog>
    </div>
  );
};

interface GetDialogPrompt {
  (payload: {
    method: SendBookingLinkMethod | null;
    email?: string;
    phone?: string;
  }): {
    promptTitle: string;
    promptBody: string;
  };
}

/**
 * Gets prompt text (title and body) for dialog prompt based on passed method.
 * For type safety, it accepts `null` as `method` (and returns empty strings for `promptTitle` and `promptBody`),
 * but that should not happen in reality.
 * @param {string | null} param.method "email" or "sms"
 * @param {string} param.email (optional) customer's email
 * @param {string} param.phone (optional) customer's phone
 * @returns
 */
const getDialogPrompt: GetDialogPrompt = ({ method, email, phone }) => {
  if (!method) return { promptTitle: "", promptBody: "" };

  const promptLookup = {
    [SendBookingLinkMethod.Email]: {
      promptTitle: i18n.t(Prompt.SendEmailTitle),
      promptBody: i18n.t(Prompt.ConfirmEmail, { email }),
    },
    [SendBookingLinkMethod.SMS]: {
      promptTitle: i18n.t(Prompt.SendSMSTitle),
      promptBody: i18n.t(Prompt.ConfirmSMS, { phone }),
    },
  };

  return promptLookup[method];
};

const useStyles = makeStyles((theme) => ({
  actionButton: {
    marginRight: "0.5rem",
    [theme.breakpoints.down("md")]: {
      width: "80%",
      margin: "0.5rem 10%",
    },
    // The following is a workaround to not overrule the Mui base button styles
    // by Tailwind's preflight reset
    backgroundColor: theme.palette.primary.main,
  },
}));

export default ActionButtons;
